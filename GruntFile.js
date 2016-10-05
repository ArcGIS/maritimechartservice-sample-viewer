module.exports = function(grunt) {
  var stemappDir = 'C:\\arcgis-web-appbuilder-1.3\\client\\stemapp';
  var appDir = 'C:\\arcgis-web-appbuilder-1.3\\server\\apps\\3';

  grunt.initConfig({
    watch: {
      main: {
        files: ['**'],
        tasks: ['sync'],
        options: {
          spawn: false
        }
      }
    },

    sync: {
      stemApp: {
        files: [{
          cwd: 'src',
          src: [
            'widgets/**', 'libs/**'
          ],
          dest: stemappDir
        }],
        verbose: true // Display log messages when copying files
      },
      app: {
        files: [{
          cwd: 'src',
          src: [
            'widgets/**', 'libs/**'
          ],
          dest: appDir
        }],
        verbose: true // Display log messages when copying files
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sync');

  grunt.registerTask('default', ['sync', 'watch']);
};
