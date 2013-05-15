module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js', 'public/js/*.js'],
      options: {
        eqnull: true
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['jshint']);


};