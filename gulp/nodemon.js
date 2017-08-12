'use strict';
const Gulp = require('gulp');
const Nodemon = require('gulp-nodemon');


Gulp.task('nodemon', () => {

    //const nodeArgs = ['--inspect'];
    const nodeArgs = [''];

    if (process.env.DEBUGGER) {
        nodeArgs.push('--debug');
    }

    const config = {
        script: 'server.js',
        ext: 'js md',
        ignore: [
            'client/**/*',
            'gulp/**/*',
            'public/**/*',
            'node_modules/**/*'
        ],
        nodeArgs
    };

    Nodemon(config).on('restart', (files) => {

        console.log('change detected:', files);
    });
});
