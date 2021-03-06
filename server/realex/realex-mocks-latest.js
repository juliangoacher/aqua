// The code below assumes the following property on the user object:
//
//  realex:
//       UserId,
//       PortalId,
//       SubscriptionType,
//       SubscriptionActive,
//       Email,
//       FirstName,
//       LastName,
//       AutoRenewal,
//       StartSubscription,
//       EndSubscription,
//       PriceInfo:
//          EffectivePrice,
//          Currency,
//          Price
//
// Values are exported from the following tables in the old site setup:
//
//  UserSubscription:
//       UserId,
//       PortalId,
//       SubscriptionType,
//       SubscriptionActive,
//       Email,
//       FirstName,
//       LastName,
//       AutoRenewal,
//       StartSubscription,
//       EndSubscription
//
//  PriceInfo:
//       EffectivePrice,
//       Currency,
//       Price

const Q = require('q');
const XmlBuilder = require('xmlbuilder'); // https://www.npmjs.com/package/xmlbuilder
const Https = require('https');
const parseXML = require('xml2js').parseString; // https://www.npmjs.com/package/xml2js


/**
 * Create a job function for renewing Realex subscribers.
 * @param aqua  The host Aqua system.
 * @param opts  Additional options.
 */
function createJob( aqua, opts ) {

    const db = aqua.db; // TODO Confirm this is valid.

    // Read options & settings.
    let merchantID, account, secret, host, paymentMethod
        = Object.assign({
            host:           'epage.payandshop.com',
            paymentMethod:  'visa01'
        }, opts );

    /// Return a list of expired user subscriptions.
    function getExpiredUserSubscriptions() {
        // Select user subscriptions where EndSubscription < current date
        // and AutoRenewal = true
        let dp = Q.defer();
        db.collection('users')
            .find({
                isActive: true,
                realex: {
                    SubscriptionActive: "1",
                    AutoRenewal: "1",   // TODO Confirm this
                    EndSubscription: { $lt: new Date.toISOString() }
                }
            })
            .toArray( ( err, users ) => {
                if( err ) {
                    dp.reject( err );
                }
                else {
                    dp.resolve( users );
                }
            });
        return dp.promise;
    }

    /// Return the subscription price for the specified user.
    function getPriceForUser( user ) {
        // This assumes simply that the price is available as a property of
        // the user object's realex property.
        return Q.resolve( user.realex.PriceInfo );
    }

    /// Construct and submit a Realex payment request.
    function submitCCPaymentRequest( user, price ) {
        let body = makeCCPaymentRequestXML( user, price );
        // Make the HTTP request options.
        let opts = {
            host:   host,
            path:   '/epage-remote-plugins.cgi',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; encoding="utf-8"'
            }
        };
        // The deferred result.
        let dp = Q.defer();
        // Submit the request.
        let req = Https.request( opts, ( res ) => {
            let buffer = [];
            res.on('data',  data => [].push( data ) );
            res.on('error', err  => dp.reject( err ) );
            res.on('end',  () => {
                // Parse the XML response and return to the caller.
                let xml = Buffer.from( buffer ).toString();
                parseXML( xml, ( err, result ) => {
                    if( err ) {
                        dp.reject( err );
                    }
                    else {
                        dp.resolve( result );
                    }
                });
            });
        });
        req.on('error', err => dp.reject( err ) );
        req.write( body );
        req.end();
        // Return the deferred promise.
        return dp;
    }

    /// Make the XML body for a payment request.
    function makeCCPaymentRequestXML( user, price ) {
        // Make some values needed by the request.
        let timestamp = makeTimestamp();
        let orderID   = `OrderId_${timestamp}`;
        let sha1hash  = makeSHA1Hash([
            timestamp,
            merchantID,
            orderID,
            price.Price,
            price.Currency,
            user.realex.UserId
        ]);
        // Construct the request XML body.
        let body = XmlBuilder.create('request', {
            'type':     'receipt-in',
            'timestamp': timestamp
        })
        .ele('merchantid',    {},   merchantID )
        .ele('account',       {},   account )
        .ele('orderid',       {},   orderID )
        .ele('autosettle',    { 'flag': '1' } )
        .ele('amount',        { 'currency': price.Currency }, price.Price )
        .ele('payerref',      {},   user.realex.UserId )
        .ele('paymentmethod', {},   paymentMethod )
        .ele('sha1hash',      {},   sha1hash )
        .end({ pretty: true });
        return body;
    }

    // Return current time in yyyyMMddHHmmss format.
    function makeTimestamp() {
        return new Date()
            .toISOString()
            .replace(/[T:.-]/g,'')
            .substring( 0, 14 );
    }

    const crypto = require('crypto');

    // Make the secure hash submitted with a payment request.
    function makeSHA1Hash( fields ) {
        let data = fields.join('.');
        let sha1 = crypto.createHmac('sha1');
        sha1.update( data );
        data = sha1.digest('hex');
        data += `.${secret}`;
        sha1 = crypto.createHmac('sha1');
        sha1.update( data );
        return sha1.digest('hex');
    }

    // Update a user's subscription data.
    function updateUserSubscription( user, response ) {
        if( response.result == '00' ) {
            user.realex.StartSubscription = new Date().toISOString();
            let end = new Date();
            if( user.realex.SubscriptionType == 'Month' ) {
                end.setMonth( end.getMonth() + 1 );
            }
            else {
                end.setYear( end.getYear() + 1 );
            }
            user.realex.EndSubscription = end.toISOString();
        }
        else {
            user.realex.SubscriptionActive = false;
        }
        let dp = Q.defer();
        db.collection('users')
            .updateOne( user, ( err, result ) => {
                if( err ) {
                    dp.reject( err );
                }
                else {
                    dp.resolve( result );
                }
            });
        return dp.promise;
    }

    /// Send a notification email.
    function sendNotificationEmail( user, result ) {
        let userEmail = user.email || user.realex.Email;
        // See https://nodemailer.com/about/
        let opts = {
            from:       'info@mocks.ie',
            to:         `${userEmail}, daniel@mocks.ie`,
            subject:    'Renewal A-Grade'
        };
        let template = 'subscription-confirm.md';   // TODO Review this.
        let context = Object.extend( {}, user.realex, {
            DisplayName:    `${user.realex.FirstName} ${user.realex.LastName}`,
            OrderNumber:    result.OrderId          // TODO Confirm this.
        });
        let dp = Q.defer();
        // TODO: Confirm following reference.
        aqua.mailer.sendEmail( opts, template, context, ( err ) => {
            if( err ) {
                dp.reject( err );
            }
            else {
                dp.resolve();
            }
        });
        return dp.promise;
    }

    // A scheduled job for renewal of expired user subscriptions.
    async function renewExpiredSubscriptions() {
        let expired = await getExpiredUserSubscriptions();
        Log.debug('Found %d expired subscriptions');
        for( let i = 0; i < expired.length; i++ ) {
            let user = expired[i];
            Log.debug('Updating subscription for user %s', user.UserId );
            let price    = await getPriceForUser( user );
            let response = await submitCCPaymentRequest( user, price );
            let result   = await updateUserSubscription( user, response );
            await sendNotificationEmail( user, result );
        }
    }

    return renewExpiredSubscriptions();
}
