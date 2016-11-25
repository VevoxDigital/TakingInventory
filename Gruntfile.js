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
            name: '<%= pkg.productName %>',
            version: '<%= pkg.version %>'
          }
        },
        files: {
          'dist/launcher.html': 'views/launcher.pug'
        }
      }
    },

    // compile sass stylesheets
    sass: {
      dist: {
        options: {
          style: 'compressed',
          loadPath: [ 'node_modules', 'styles/partials' ]
        },
        files: [{
          expand: true,
          cwd: 'styles',
          src: '*.scss',
          dest: 'dist/',
          ext: '.css'
        }]
      }
    },

    // clean out the dist directory
    clean: {
      dist: [ 'dist/' ]
    }

  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-pug');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', [ 'dist' ]);
  grunt.registerTask('clean', [ 'clean:dist' ]);
  grunt.registerTask('dist', [ 'clean', 'copy:dist', 'pug:dist', 'sass:dist' ]);

};
