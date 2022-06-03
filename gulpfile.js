// Initialize modules
// ------------------
const fs = require('fs');
const { src, dest, watch, series, parallel } = require('gulp');
const del = require('del');
const data = require('gulp-data');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const autoprefixer = require('autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const cssnano = require('cssnano');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass')(require('sass'));
const njk = require('gulp-nunjucks-render');
const browsersync = require('browser-sync').create();

// Base
const project_folder = '.'
const source_folder  = './src'
const build_folder   = './build'
const dist_folder    = './dist'


// File path variables
// -------------------
const path = {
    src: {
        partials: source_folder + '/html/partials/*.njk',
        favicon:  source_folder + '/assets/images/favicon.ico',
        package:  project_folder + '/package.json',
        images:   source_folder + '/assets/images/**/*.{gif,jpg,jpeg,png,ico,svg}',
        fonts:    source_folder + '/assets/fonts/**/*.{eot,svg,ttf,woff}',
        scss:     source_folder + '/assets/styles/**/*.scss',
        html:     source_folder + '/html',
        data:     source_folder + '/data.json',
        njk:      source_folder + '/html/pages/*.+(html|njk)',
        js:       source_folder + '/assets/js/app.js',
        // Vendors
        modernizr: project_folder + '/modernizr.js',
	    jquery:    'node_modules/jquery/dist/jquery.min.js'
    },
    build: {
        scripts: [build_folder + "/assets/js/**/*.js"],
        favicon: build_folder + '/',
        images:  build_folder + '/assets/images/',
        fonts:   build_folder + '/assets/fonts/',
        dest:    build_folder + '/',
        html:    build_folder + '/',
        css:     build_folder,
        js:      build_folder + '/assets/js',
        // Vendors
        vendors: build_folder + '/assets/js/vendors/'
    },
    dist: {
        html: dist_folder + '/',
        css:  dist_folder + '/'
    },
    clean: build_folder + '/'
}


// Which files changes
// -------
const whichFile = watch([path.src.njk, path.src.partials, path.src.scss, path.src.js]);

// Update file
whichFile.on('change', function(path, stats) {
    console.log('\u001b[' + 35 + 'm' + `File "${path}" was updated` + '\u001b[0m');
});
// Add new file
whichFile.on('add', function(path, stats) {
    console.log('\u001b[' + 32 + 'm' + `File "${path}" was added` + '\u001b[0m');
});
// Remove file
whichFile.on('unlink', function(path, stats) {
    console.log('\u001b[' + 31 + 'm' + `File "${path}" was removed` + '\u001b[0m');
});



// Sass tasks
// ----------
function scssTask() {
    return src(path.src.scss)
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(postcss( [autoprefixer()] ))
        .pipe(sourcemaps.write(path.build.css))
        .pipe(dest(path.build.css));
}

// JS task
// -------
function jsTask() {
    return src(path.src.js)
        .pipe(concat('app.js'))
        .pipe(uglify())
        .pipe(dest(path.build.js));
}

// Browsersync tasks
// -----------------
function server(cb) {
    browsersync.init({
        server: {
            baseDir: build_folder + '/'
        },
        open: false
    });
    cb();
}

function browsersyncReload(cb) {
    browsersync.reload();
    cb();
}

// Cachebusting task
// -----------------
const cbString = new Date().getTime();

function cacheBustTask() {
    return src(['index.html'])
        .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
        .pipe(dest('.'));
}


// Nunjucks
// --------
function njkTask() {
    return src(path.src.njk)
    .pipe(data(function(file) {
        return JSON.parse(fs.readFileSync(path.src.data));
      }))
    .pipe(data(function(file) {
        return JSON.parse(fs.readFileSync(path.src.package));
        }))
    .pipe(
        njk({
            path: [path.src.html],
        }))
    .pipe(dest(path.build.html))
}

function jsVendors() {
	// Copy all vendors
	return src([
        path.src.modernizr,
        path.src.jquery
    ])
    .pipe(dest(path.build.vendors))
}

// Copy favicon
function favicon() {
    // Copy favicon.ico to build/ folder
    return src(path.src.favicon)
        .pipe(dest(path.build.dest))
}

// Copy fonts
function fonts() {
    // Copy fonts to build/ folder
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts))
}

// Copy images
function images() {
    // Copy images to build/ folder
    return src(path.src.images)
        .pipe(dest(path.build.images))
}

    
// Watch task
// ----------
function watcher() {
    watch(path.src.scss, series(scssTask, browsersyncReload));
    watch(path.src.js, series(jsTask, browsersyncReload));
    watch([path.src.njk, path.src.partials], series(njkTask, browsersyncReload));
}



// Clean task
// ----------
function clean() {
    return del(path.clean)
}

// Define Tasks
// ----------
let builder = series(clean, jsVendors, favicon, fonts, images, parallel(scssTask, jsTask, njkTask))
let run = parallel(builder, watcher, server)



exports.scss = series(scssTask);

exports.clean = series(clean);

exports.build = builder

exports.default = run