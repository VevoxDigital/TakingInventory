'use strict'

exports = module.exports = grunt => {
  grunt.initConfig({
    app: grunt.file.readJSON('package.json'),

    copy: {
      build: {
        files: [
          { expand: true, cwd: 'src', src: [ 'main/**/*.js' ], dest: 'target/' },
          { expand: true, cwd: 'src', src: [ 'index.js' ], dest: 'target/' }
        ]
      },
      app: {
        files: [
          { expand: true, src: 'package.json', dest: 'target/' }
        ]
      }
    },

    clean: {
      target: [ 'target' ],
      dist: [ 'dist' ],
      tmp: [ '.tmp' ]
    },

    shell: {
      npm: {
        command: 'cd target && npm install --production && cd ..'
      }
    },

    electron: {
      all: {
        options: {
          name: '<%= app.productName %>',
          dir: 'target',
          out: 'dist',
          platform: 'all',
          arch: 'all',
          asar: true,
          overwrite: true,

          // darwin specific
          'app-category-type': 'public.app-category.games'
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

  // load tasks
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-electron')
  grunt.loadNpmTasks('grunt-shell')

  // register tasks
  grunt.registerTask('rebuild', [ 'clean:target', 'build' ])
  grunt.registerTask('build', [
    'copy:build',
    'copy:app'
  ])
  grunt.registerTask('package', [
    'clean:dist',
    'shell:npm',
    'electron:x64',
    'clean:tmp'
  ])
}
