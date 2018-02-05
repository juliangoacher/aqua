const Q = require('q');

/**
 * Sequentially evaluate an asynchronous operation against an array of items.
 * @param items An array of items.
 * @param op    A function defining an asynchronous operation. The function
 *              is passed one of the items as its first argument, and the
 *              result of the previous invocation of the operation in the
 *              sequence as its second argument. Can return a value of a
 *              deferred promise resolving to the value of the opertion.
 *              The next operation in the sequence will only be invoked
 *              once the previous operation has completed.
 * @param value An initial value to pass as the second argument to the
 *              operation function.
 * @return A deferred promise, resolving to the result of invoking each
 *         operation function in sequence.
 */
function sequence( items, op, value = {} ) {
    // Map the array of items to an array of functions which invoke
    // the asynchronous operation.
    let ds = items.map( item => (( value ) => op( item, value )) );
    // Invoke the array of functions in sequence.
    return ds.reduce( Q.when, Q( value ) );
}
exports.sequence = sequence;

// Append an item to a list and return the list.
function append( item, list ) {
    list.push( item );
    return list;
}

/**
 * Sequentially evaluate an asyncronous operation against an array of items.
 * Similar to sequence(), but returns an array containing the result of evaluating
 * the operation against each corresponding item in the original array of items.
 */
function sequenceMap( items, op ) {
    return sequence( items, ( item, results ) => {
        return op( item ).then( result => append( result, results ) );
    }, []);
}
exports.sequenceMap = sequenceMap;

// A map of pending async queues. See queue().
const Queues = {};

/**
 * A function for executing operations on named, asynchronous queues.
 * Multiple ansynchronous operations may be added to a queue, and will be executed
 * in the order they are added. Each operation will be completed before the next
 * operation on the queue is started. This can be useful for managing concurrent
 * access to a contestable resource, e.g. a file.
 * The function returns a deferred promise that will be resolved or rejected with
 * the result of the operation passed to the function, once that operation is
 * executed by the queue.
 * @param queueName A queue name; any string value may be passed.
 * @param op        A function describing the operation to be executed on the queue.
 *                  The function should return a deferred promise, resolving to the
 *                  operation's result.
 */
function queue( queueName, op ) {
    // The deferred promise to be returned to the function caller.
    const dp = Q.defer();
    // An item to put on the queue, containing the deferred promise + operation
    // function.
    let queueItem = { dp, op };
    // Check if a queue already exists under the specified name.
    let queue = Queues[queueName];
    if( queue ) {
        // If a queue is found then this means that one or more operations are
        // already queued and being processed; add the new operation to the end
        // of the queue.
        queue.push( queueItem );
    }
    else {
        // Else if no queue is found then create a new queue and start processing
        // it.
        // A function to process the next item on the current queue.
        function next() {
            // Read the queue.
            let queue = Queues[queueName];
            // If items on the queue...
            if( queue.length > 0 ) {
                // ...then remove the first item and call the operation function.
                // Note that an empty queue isn't immediately removed here; this
                // is to ensure that a new operation is added to the queue, if the
                // asyncq function is called whilst the current operation is
                // completing.
                let item = queue.shift();
                Q.fcall( item.op )
                .then( ( result ) => {
                    // Pass the operation result to the item's deferred promise
                    // and iterate to next item.
                    item.dp.resolve( result );
                    next();
                })
                .fail( ( err ) => {
                    // Operation failed, pass the error to the item's deferred
                    // promise and iterate to next item.
                    item.dp.reject( err );
                    next();
                });
            }
            // Else the queue is now empty, delete it and end queue processing.
            else delete Queues[queueName];
        }

        // Create a new queue with the new queue item...
        Queues[queueName] = [ queueItem ];
        // ...and start processing the queue.
        next();
    }
    // Return the deferred promise to the function caller.
    return dp.promise;
}
exports.queue = queue;

/**
 * A function for performing the same asynchronous operation on a named queue.
 * The function is given a queue name and an operation function, and returns
 * a function which is used to add a new operation iteration to the named queue.
 * The function result is invoked with an arguments object, which is passed to
 * the operation function when it is invoked on the asynchronous queue.
 */
function opqueue( queueName, op ) {
    return function( args ) {
        return queue( queueName, () => op( args ) );
    }
}
exports.opqueue = opqueue;

/* NOTE different delayed batch behaviours:
 * 1. Execute batch on every interval (e.g. one per minute)
 *    - turns a sequence of randomly timed events into a sequence
 *      of events grouped on a standard interval.
 *    - smooths a sequence of frequent but randomly timed events
 *      into a sequence of grouped events on a predictable
 *      schedule
 * 2. Execute batch x after last operation added
 *    - turns a sequence of randomly timed events into a sequence
 *      of events grouped but randomly timed events.
 *    - smooths a sequence composed of bursts of individual events
 *      into single groups
 */

/**
 * Create an asychronous operation batch.
 * Batches are a tool for allowing a sequence of asychronous operations
 * to be temporarally grouped; for example, if a sequence of events are
 * arriving with small but random time intervals between them, using a 
 * batch provides a way for the events to be gathered into a group and
 * processed as a whole, rather than processing each event individually.
 * Batch grouping is achieved by specifying a time interval as a delay
 * parameter. The batch as a whole won't be processed until after the
 * specified delay interval has elapsed since the last operation was
 * added to the group. The delay counter is reset each time an operation
 * is added to the group. So for example, if the delay parameter is
 * specified as 10000 (i.e. 10 seconds) then the batch won't execute
 * until 10 seconds after the last operation is added to the batch. If
 * a sequence of 4 operations is added, at intervals of 5 seconds, then
 * the batch won't execute until 25 seconds after the first operation is
 * added (i.e. (1 * 0) + (3 * 5) + 10 seconds).
 */
function batch( batchName, delay ) {

    // The ID of the timer used to delay the start of the batch.
    let timeoutID = false;
    // A deferred promise, resolved when the batch starts processing.
    let startdp = Q.defer();
    // A deferred promise, resolved when the batch completed processing.
    let enddp = Q.defer();

    // Start by queueing an operation which will block the queue until
    // the delay timer is fired.
    queue( batchName, () => startdp.promise );

    /**
     * Add an operation to the batch.
     * Adds the operation to the batch queue, and resets the batch's
     * start timer.
     * If the batch is already started, then the operation isn't added
     * to the batch queue, and the function returns false. In this case,
     * a new batch should be created and the operation added to that
     * batch.
     */
    function add( op ) {
        if( !startdp ) {
            return false;
        }
        // First check the state of the start delay timer. If a timer
        // was previously set, then clear it...
        if( timeoutID ) {
            clearTimeout( timeoutID );
        }
        // ...before starting a new delay timer, to go off after the
        // specified delay.
        timeoutID = setTimeout( Date.now() + delay, startBatch );
        // Add the new operation to the batch queue.
        queue( batchName, op )
        .then( () => {
            // If the batch is complete then resolve the batch promise.
            if( batchComplete() ) {
                enddp.resolve( true );
            }
        })
        .fail( ( err ) => {
            enddp.reject( err );
            // TODO: Clear queue?
        });
        return true;
    }

    // A function to start processing on the batch queue by resolving
    // the deferred promise used to block queue processing.
    function startBatch() {
        startdp.resolve( true );
        startdp = false; // Used to flag that the batch has started.
    }

    // Test if the batch is complete. Returns true if the batch queue
    // is empty.
    function batchComplete() {
        return Queues[batchName] === undefined;
    }

    // Return a promise which will be resolved once all operations in
    // the batch have been completed.
    return dp.promise;
}

