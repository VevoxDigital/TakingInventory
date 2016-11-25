'use strict';

exports = module.exports = grunt => {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // copy JS files
    copy: {
      dist: {
        files: [
          { expand: true, cwd: 'app/', src: [ '**' ], dest: 'dist/' }
        ]
      }
    },

    // compile pug (i.e. jade) views
    pug: {
      dist: {
        options: {
          data: {
            version: '<%= pkg.version %>'
          }
        },
        files: {
          'dist/launcher.html': 'views/launcher.pug'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-pug');

  grunt.registerTask('default', [ 'dist' ]);
  grunt.registerTask('dist', [ 'copy:dist', 'pug:dist' ]);

};
