/* eslint-disable */

var webpack = require('webpack');

var coverage;
var reporters;
if (process.env.CONTINUOUS_INTEGRATION) {
  coverage = {
    type: 'lcov',
    dir: 'coverage/'
  };
  reporters = ['coverage', 'coveralls', 'karma-typescript'];
}
else {
  coverage = {
    type: 'html',
    dir: 'coverage/'
  };
  reporters = ['progress', 'coverage', 'karma-typescript'];
}

module.exports = function (config) {
  config.set({
    browsers: ['Chrome', 'Firefox'],
    browserNoActivityTimeout: 30000,
    frameworks: ['mocha', 'chai', 'sinon-chai', 'karma-typescript'],
    files: ['src/*.ts', 'src/*.tsx', 'test/*.tsx'],
    preprocessors: {
      "**/*.ts": "karma-typescript",
      "**/*.tsx": "karma-typescript",
    },
    reporters: reporters,
    coverageReporter: coverage,
    singleRun: true,
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json'
    }
  });
};
