const { src, dest } = require("gulp");
const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer"),
    browsersync = require("browser-sync").create(),
    clean_css = require("gulp-clean-css"),
    del = require("del"),
    fileinclude = require("gulp-file-include"),
    group_media = require("gulp-group-css-media-queries"),
    plumber = require("gulp-plumber"),
    rename = require("gulp-rename"),
    scss = require("gulp-sass")(require("sass")),
    sourcemaps = require("gulp-sourcemaps"),
    uglify = require("gulp-uglify-es").default;

const rollup = require("gulp-better-rollup"),
    babel = require("rollup-plugin-babel"),
    resolve = require("rollup-plugin-node-resolve"),
    commonjs = require("rollup-plugin-commonjs");

const directories = {
    build: {
        html: "./dist/",
        js: "./dist/js/",
        css: "./dist/css/",
    },
    src: {
        html: ["./src/**/*.html", "!" + "./src/_*.html"],
        js: ["./src/js/index.js"],
        css: "./src/scss/style.scss",
    },
    watch: {
        html: "./src/**/*.html",
        js: "./src/**/*.js",
        css: "./src/scss/**/*.scss",
    },
    clean: "./dist",
};

function browserSync(done) {
    browsersync.init({
        server: { baseDir: "./dist" },
        notify: false,
        port: 3000,
    });
}

function html() {
    return src(directories.src.html, {})
        .pipe(fileinclude({ prefix: "<!--=", suffix: "-->" }))
        .on("error", (err) => console.error("Error!", err.message))
        .pipe(dest(directories.build.html))
        .pipe(browsersync.stream());
}

function css() {
    return src(directories.src.css, {})
        .pipe(sourcemaps.init())
        .pipe(scss({ outputStyle: "expanded" }).on("error", scss.logError))
        .pipe(sourcemaps.write())
        .pipe(rename({ extname: ".min.css" }))
        .pipe(dest(directories.build.css))
        .pipe(browsersync.stream());
}

function js() {
    return src(directories.src.js, {})
        .pipe(sourcemaps.init())
        .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, "umd"))
        .pipe(sourcemaps.write())
        .pipe(rename({ suffix: ".min", extname: ".js" }))
        .pipe(dest(directories.build.js))
        .pipe(browsersync.stream());
}

function clean() {
    return del(directories.clean);
}

function watchFiles() {
    gulp.watch([directories.watch.html], html);
    gulp.watch([directories.watch.css], css);
    gulp.watch([directories.watch.js], js);
}

function cssBuild() {
    return src(directories.src.css, {})
        .pipe(plumber())
        .pipe(scss({ outputStyle: "expanded" }).on("error", scss.logError))
        .pipe(group_media())
        .pipe(autoprefixer({ grid: true, overrideBrowserslist: ["last 5 versions"], cascade: true }))
        .pipe(dest(directories.build.css))
        .pipe(clean_css())
        .pipe(rename({ extname: ".min.css" }))
        .pipe(dest(directories.build.css))
        .pipe(browsersync.stream());
}

function jsBuild() {
    del(directories.build.js + "app.min.js");
    del(directories.build.js + "vendors.min.js");
    return src(directories.src.js, {})
        .pipe(plumber())
        .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, "umd"))
        .pipe(dest(directories.build.js))
        .pipe(uglify(/* options */))
        .on("error", (err) => {
            console.log(err.toString());
            this.emit("end");
        })
        .pipe(rename({ extname: ".min.js" }))
        .pipe(dest(directories.build.js))
        .pipe(browsersync.stream());
}

function htmlBuild() {
    return src(directories.src.html, {})
        .pipe(plumber())
        .pipe(fileinclude({ prefix: "<!--=", suffix: "-->" }))
        .pipe(dest(directories.build.html))
        .pipe(browsersync.stream());
}

let buildDev = gulp.series(clean, gulp.parallel(html, css, js));
let watchDev = gulp.series(buildDev, gulp.parallel(watchFiles, browserSync));
let build = gulp.series(clean, gulp.parallel(htmlBuild, cssBuild, jsBuild));

exports.build = build;
exports.watch = watchDev;
exports.default = watchDev;
