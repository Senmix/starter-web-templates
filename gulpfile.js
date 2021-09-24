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
    uglify = require("gulp-uglify-es").default,
    fonter = require("gulp-fonter"),
    fs = require("fs"),
    imagemin = require("gulp-imagemin"),
    newer = require("gulp-newer"),
    ttf2woff = require("gulp-ttf2woff"),
    ttf2woff2 = require("gulp-ttf2woff2");

const rollup = require("gulp-better-rollup"),
    babel = require("rollup-plugin-babel"),
    resolve = require("rollup-plugin-node-resolve"),
    commonjs = require("rollup-plugin-commonjs");

const directories = {
    build: {
        html: "./dist/",
        js: "./dist/js/",
        css: "./dist/css/",
        images: "./dist/img/",
        fonts: "./dist/fonts/",
    },
    src: {
        html: ["./src/**/*.html", "!" + "./src/_*.html"],
        js: ["./src/js/index.js"],
        css: "./src/scss/style.scss",
        fonts: "./src/fonts/*.ttf",
        images: ["./src/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}", "!**/favicon.*"],
    },
    watch: {
        html: "./src/**/*.html",
        js: "./src/**/*.js",
        css: "./src/scss/**/*.scss",
        images: "./src/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}",
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

function images() {
    return src(directories.src.images).pipe(newer(directories.build.images)).pipe(dest(directories.build.images));
}

function fonts() {
    src(directories.src.fonts).pipe(plumber()).pipe(ttf2woff()).pipe(dest(directories.build.fonts));
    return src(directories.src.fonts).pipe(ttf2woff2()).pipe(dest(directories.build.fonts)).pipe(browsersync.stream());
}

function fonts_otf() {
    return src("./src/fonts/*.otf")
        .pipe(plumber())
        .pipe(fonter({ formats: ["ttf"] }))
        .pipe(dest("./src/fonts/"));
}

function fontstyle() {
    const filepath = "./src/scss/fonts.scss";
    fs.access(filepath, (error) => {
        if (error) return;

        let file_content = fs.readFileSync(filepath);
        if (file_content == "") {
            fs.writeFile(filepath, "", () => { });
            fs.readdir(directories.build.fonts, (err, items) => {
                if (items) {
                    let c_fontname;
                    for (var i = 0; i < items.length; i++) {
                        let fontname = items[i].split(".");
                        fontname = fontname[0];
                        if (c_fontname != fontname) {
                            fs.appendFile(
                                filepath,
                                `@include font("${fontname}", "${fontname}", "400", "normal");\r\n`,
                                () => { }
                            );
                        }
                        c_fontname = fontname;
                    }
                }
            });
        }
    });

    return src(directories.src.html).pipe(browsersync.stream());
}

function copyFolders() {
    ["videos"].forEach((folder) => {
        src("./src/" + folder + "/**/*.*", {})
            .pipe(newer("./" + folder + "/"))
            .pipe(dest("./" + folder + "/"));
    });

    return src(directories.src.html).pipe(browsersync.stream());
}

function clean() {
    return del(directories.clean);
}

function watchFiles() {
    gulp.watch([directories.watch.html], html);
    gulp.watch([directories.watch.css], css);
    gulp.watch([directories.watch.js], js);
    gulp.watch([directories.watch.images], images);
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

function imagesBuild() {
    return src(directories.src.images)
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3, // 0 to 7
            })
        )
        .pipe(dest(directories.build.images));
}

let fontsBuild = gulp.series(fonts_otf, fonts, fontstyle);
let buildDev = gulp.series(clean, gulp.parallel(fontsBuild, copyFolders, html, css, js, images));
let watchDev = gulp.series(buildDev, gulp.parallel(watchFiles, browserSync));
let build = gulp.series(clean, gulp.parallel(htmlBuild, cssBuild, jsBuild, imagesBuild, fontsBuild));

exports.fonts = fontsBuild;
exports.build = build;
exports.watch = watchDev;
exports.default = watchDev;
