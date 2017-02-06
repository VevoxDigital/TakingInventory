'use strict'

exports = module.exports = grunt => {
  grunt.initConfig({
    app: grunt.file.readJSON('package.json'),

    copy: {
      app: {
        files: [
          {
            expand: true,
            src: 'package.json',
            dest: 'target/'
          }, {
            expand: true,
            src: 'index.js',
            dest: 'target/'
          }
        ]
      },
      engine: {
        files: [{
          expand: true,
          cwd: 'engine',
          src: '**/*.js',
          dest: 'target/engine'
        }]
      }
    },

    // symlink for node_modules into package
    symlink: {
      modules: {
        src: 'node_modules/',
        dest: 'target/node_modules'
      }
    },

    // clean task
    clean: {
      target: [ 'target' ],
      dist: [ 'dist' ],
      tmp: [ 'target/node_modules' ]
    },

    // pug (a.k.a. jade) view engine
    pug: {
      app: {
        options: {
          data: {
            app: grunt.file.readJSON('package.json')
          }
        },
        files: [{
          expand: true,
          cwd: 'app',
          src: 'views/**/*.pug',
          dest: 'target/app',
          ext: '.html'
        }]
      }
    },

    // sass style engine
    sass: {
      app: {
        options: {
          style: 'compressed',
          loadPath: [ 'app/styles' ]
        },
        files: [{
          expand: true,
          cwd: 'app',
          src: 'styles/*.scss',
          dest: 'target/app',
          ext: '.css'
        }]
      }
    },

    // shell commands
    shell: {
      npm: {
        command: 'cd target && npm install --production && cd ..'
      }
    },

    // electron packager
    electron: {
      all: {
        options: {
          name: '<%= app.productName %>',
          dir: 'target',
          out: 'dist',
          platform: 'all',
          arch: 'all',
          asar: true,
          overwrite: true
        }
      },
      x64: {
        options: {
          name: '<%= app.productName %>',
          dir: 'target',
          out: 'dist',
          platform: 'win32,linux,darwin',
          arch: 'x64',
          asar: true,
          overwrite: true,

          // darwin specific
          'app-category-type': 'public.app-category.games'
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-symlink')
  grunt.loadNpmTasks('grunt-contrib-pug')
  grunt.loadNpmTasks('grunt-contrib-sass')

  grunt.loadNpmTasks('grunt-electron')
  grunt.loadNpmTasks('grunt-shell')

  // we are only going to build against x64 for deployment,
  // specifically, we're using `win32-x64`, `linux-x64`, and `darwin-x64` (i.e. all-x64)
  // if others are needed, advanced users may run `package:all` for other platforms
  grunt.registerTask('build', [
    'clean:target',
    'copy:app',
    'copy:engine',
    'pug:app',
    'sass:app'
  ])

  grunt.registerTask('package', [
    // we are only going to build against x64 for deployment,
    // specifically, we're using `win32-x64`, `linux-x64`, and `darwin-x64` (i.e. all-x64)
    // if others are needed, advanced users may run `electron:all` for other platforms
    'clean:dist',
    'shell:npm',
    'electron:x64',
    'clean:tmp'
  ])
}
