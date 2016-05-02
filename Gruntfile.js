var path = require('path');

module.exports = function(grunt) {
    var TEST_RUNNER = path.join(process.cwd(), 'test', 'test_runner');
    var UNIT_TESTS = 'test/unit/**/*_test.js';
    var INTEGRATION_TESTS = 'test/integration/**/*_test.js';

    // NPM tasks, alphabetical
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-docco');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-bump');

    grunt.initConfig({
        // Clean
        clean: {
            docs: ['docs'],
            coverage: ['test/coverage.html']
        },

        //Bump up version of npm module
        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: false,
                regExp: false
            }
        },

        // Documentation
        docco: {
            main: {
                src: ['lib/**/*.js'],
                options: {
                    output: 'docs/'
                }
            }
        },

        // Server-side mocha tests
        mochaTest: {
            // Runs all tests
            unit: {
                options: {
                    require: TEST_RUNNER,
                    reporter: 'spec',
                    ui: 'bdd',
                    timeout: 200,
                    recursive: true,
                    clearRequireCache: true
                },
                src: [UNIT_TESTS]
            },

            integration: {
                options: {
                    require: TEST_RUNNER,
                    reporter: 'spec',
                    ui: 'bdd',
                    timeout: 10000,     // Allow up to 10s for integration tests to fail
                    slow: 100,          // Mark tests as slow if they take longer than 0.1s
                    recursive: true,
                    clearRequireCache: true
                },
                src: [INTEGRATION_TESTS]
            },

            // Instruments code for reporting test coverage
            instrument: {
                options: {
                    require: TEST_RUNNER,
                    reporter: 'spec',
                    ui: 'bdd',
                    timeout: 200,
                    recursive: true
                },
                src: [UNIT_TESTS]
            },

            // Reports test coverage
            coverage: {
                options: {
                    require: TEST_RUNNER,
                    reporter: 'html-cov',
                    ui: 'bdd',
                    timeout: 200,
                    recursive: true,
                    quiet: true,
                    captureFile: 'test/coverage.html'
                },
                src: [UNIT_TESTS]
            }
        },

        uglify: {
            angular: {
                files: {
                    'monocle-client-angular-min.js': ['monocle-client-angular.js'],
                    'monocle-client-jquery-min.js': ['monocle-client-jquery.js']
                }
            }
        },

        // Watches filesystem for changes to run tasks automatically
        watch: {
            unit: {
                options: {
                    spawn: false
                },
                files: [
                    'lib/**/*.js',
                    'test/**/*.js'
                ],
                tasks: ['mochaTest:unit']
            }
        },

        webpack: {
            angular: {
                entry: './lib/angular.js',
                output: {
                    path: './',
                    filename: 'monocle-client-angular.js'
                },
                stats: {
                    colors: false,
                    modules: true,
                    reasons: true
                }
            },
            jquery: {
                entry: './lib/jquery.js',
                output: {
                    path: './',
                    filename: 'monocle-client-jquery.js'
                },
                stats: {
                    colors: false,
                    modules: true,
                    reasons: true
                }
            }
        }
    });

    // Runs all tests
    grunt.registerTask('test', 'Runts all unit and integration tests', ['mochaTest:unit', 'mochaTest:integration']);

    // Runs all unit tests
    grunt.registerTask('unit', 'Runts all unit tests', ['mochaTest:unit']);

    // Runs all integration tests
    grunt.registerTask('integration', 'Runs all integration tests', ['mochaTest:integration']);

    // Generates test coverage report
    grunt.registerTask('coverage', 'Generates unit test code coverage', ['clean:coverage', 'mochaTest:instrument', 'mochaTest:coverage']);

    // Generates documentation
    grunt.registerTask('docs', 'Generates documentation', ['clean:docs', 'docco:main']);

    // Dev mode
    grunt.registerTask('dev', 'Enables watchers for developing', ['watch:unit']);

    // Build concatenated/minified version for browsers
    grunt.registerTask('build', 'Builds concatenated/minified versions for browsers', ['webpack', 'uglify']);
};
