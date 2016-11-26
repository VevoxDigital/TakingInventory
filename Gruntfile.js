'use strict';

exports = module.exports = grunt => {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // copy JS files
    copy: {
      dist: {
        files: [
          { expand: true, cwd: 'app/', src: [ '**' ], dest: 'dist/' },
          { expand: true, cwd: 'public/', src: [ '**' ], dest: 'dist/' },
          { expand: true, cwd: '.tmp', src: '**/fontawesome*', dest: 'dist/' },
          { expand: true, cwd: 'node_modules/jquery/dist', src: 'jquery.min.js', dest: 'dist/js' }
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
          'dist/launcher.html': 'views/launcher.pug',
          'dist/console.html': 'views/console.pug'
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
          dest: 'dist/styles',
          ext: '.css'
        }]
      }
    },

    // download distribution files
    downloadfile: {
      files: [
        { url: 'https://cdn.rawgit.com/FortAwesome/Font-Awesome/master/css/font-awesome.min.css', dest: '.tmp/styles', name: 'fontawesome.css' },
        { url: 'https://cdn.rawgit.com/FortAwesome/Font-Awesome/master/fonts/fontawesome-webfont.ttf', dest: '.tmp/fonts' },
        { url: 'https://cdn.rawgit.com/FortAwesome/Font-Awesome/master/fonts/fontawesome-webfont.woff', dest: '.tmp/fonts' },
        { url: 'https://cdn.rawgit.com/FortAwesome/Font-Awesome/master/fonts/fontawesome-webfont.woff2', dest: '.tmp/fonts' },
        { url: 'https://cdn.rawgit.com/FortAwesome/Font-Awesome/master/fonts/fontawesome-webfont.svg', dest: '.tmp/fonts' }
      ]
    },

    // clean out the dist directory
    clean: {
      dist: [ 'dist' ]
    }

  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-pug');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-downloadfile');

  grunt.registerTask('default', [ 'dist' ]);
  grunt.registerTask('dist', [ 'clean:dist', 'copy:dist', 'pug:dist', 'sass:dist' ]);

};
