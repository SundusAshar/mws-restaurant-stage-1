/*eslint-env */
/*eslint-disable no-unused-vars*/

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
//var concat = require('gulp-concat');
//var babel = require('gulp-bable');
var imagemin = require('gulp-imagemin');
//var pngquant = require('imagemin-pngquant');
var webp = require('gulp-webp');
//var iwebp = require('imagemin-webp');
var pump = require('pump');
var browserSync = require('browser-sync').create();
//var eslint = require('gulp-eslint');

gulp.task('styles', function(done) { 
    gulp.src('sass/**/*.scss')
    .pipe(sass({
        outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest('build/css'))
    .pipe(browserSync.stream());
    done();
});


gulp.task('copy-html', function(){
    return gulp.src(['./index.html', 'restaurant.html'])
        .pipe(gulp.dest('build/'));
});

gulp.task('copy-images', function(){
    return gulp.src('img/**/*')
        .pipe(webp())
        .pipe(gulp.dest('build/img'));
});

gulp.task('compImages', function(){
    return gulp.src('img/**/*')
        /*.pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))*/

        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest('build/img'));
});


gulp.task('sw', function(){
    return gulp.src('./sw.js')
        .pipe(gulp.dest('build/'));
});

gulp.task('manifest', function(){
    return gulp.src('site.webmanifest')
        .pipe(gulp.dest('build/'));
});

gulp.task('package', function(){
    return gulp.src('./package.json')
        .pipe(gulp.dest('build/'));
});

gulp.task('scripts', function(done) {
    pump([
        gulp.src('js/**/*.js'),
        //.pipe(babel())
        //uglify(),
        gulp.dest('build/js')
    ], done) ;
   // done();
});

gulp.task('scripts-dist', function(done) {
    gulp.src('js/**/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('build/js'));
    done();
});

gulp.task('build', gulp.parallel('copy-html', 'compImages', 'styles', 'scripts', 'sw', 'manifest', 'package', function(done){
    done();
}));

//gulp.task('default',  gulp.parallel('styles', 'lint' , function(done){

gulp.task('default',  gulp.parallel('copy-html', 'compImages', 'styles', 'build', function(done){
    gulp.watch('sass/**/*.scss', gulp.parallel('styles'));
    gulp.watch('/index.html', gulp.parallel('copy-html'));
    gulp.watch('./build/index.html').on('change', browserSync.reload);
    //gulp.watch('js/**/*.js', gulp.series('lint'));

    browserSync.init({
        server: "./build"
    });
    done();
}));
