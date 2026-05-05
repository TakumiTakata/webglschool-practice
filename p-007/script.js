import {
    WebGLUtility
} from '../lib/webgl.js';
import {
    Mat4
} from '../lib/math.js';
import {
    WebGLGeometry
} from '../lib/geometry.js';
import {
    WebGLOrbitCamera
} from '../lib/camera.js';
// import {
//     Pane
// } from '../lib/tweakpane-4.0.3.min.js';

window.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    app.init();
    // app.setupPane(); // tweakpane の初期化をメソッド化 @@@
    await app.load();
    app.setupGeometry();
    app.setupLocation();
    app.start();
}, false);

/**
 * アプリケーション管理クラス
 */
class App {
    canvas; // WebGL で描画を行う canvas 要素
    gl; // WebGLRenderingContext （WebGL コンテキスト）
    program; // WebGLProgram （プログラムオブジェクト）
    attributeLocation; // attribute 変数のロケーション
    attributeStride; // attribute 変数のストライド
    uniformLocation; // uniform 変数のロケーション
    planeGeometry; // 板ポリゴンのジオメトリ情報
    planeHeight; // 板ポリゴンの高さ
    planeVBO; // 板ポリゴンの頂点バッファ
    planeIBO; // 板ポリゴンのインデックスバッファ
    startTime; // レンダリング開始時のタイムスタンプ
    camera; // WebGLOrbitCamera のインスタンス
    isRendering; // レンダリングを行うかどうかのフラグ
    textureNoKoi; // テクスチャのインスタンス @@@
    textureKoi; // テクスチャのインスタンス @@@
    textureMap;
    textureVisibility; // テクスチャの可視性 @@@
    isAnimation; // アニメーション状態監視フラグ
    animationTime;
    offset;

    constructor() {
        // this を固定するためのバインド処理
        this.resize = this.resize.bind(this);
        this.render = this.render.bind(this);
        this.click = this.click.bind(this);
    }

    /**
     * 初期化処理を行う
     */
    init() {
        // canvas エレメントの取得と WebGL コンテキストの初期化
        this.canvas = document.getElementById('webgl-canvas');
        this.gl = WebGLUtility.createWebGLContext(this.canvas);

        // カメラ制御用インスタンスを生成する
        const cameraOption = {
            distance: 5.0, // Z 軸上の初期位置までの距離
            min: 1.0, // カメラが寄れる最小距離
            max: 10.0, // カメラが離れられる最大距離
            move: 2.0, // 右ボタンで平行移動する際の速度係数
        };
        this.camera = new WebGLOrbitCamera(this.canvas, cameraOption);

        // 最初に一度リサイズ処理を行っておく
        this.resize();

        // リサイズイベントの設定
        window.addEventListener('resize', this.resize, false);

        // クリックイベントの設定
        this.isAnimation = false;
        window.addEventListener('click', this.click, false);

        // 深度テストは初期状態で有効
        this.gl.enable(this.gl.DEPTH_TEST);

        // 初期状態ではテクスチャが見えているようにする @@@
        this.textureVisibility = true;

        this.offset = 0.0;
    }

    click() {
        if (this.isAnimation) {
            return;
        };

        // アニメーション開始フラグを立てる
        this.isAnimation = true;

        // アニメーション開始時間を取得
        this.animationTime = Date.now();
    }

    /**
     * tweakpane の初期化処理
     */
    setupPane() {
        // Tweakpane を使った GUI の設定
        const pane = new Pane();
        const parameter = {
            // texture: this.textureVisibility,
            offset: this.offset,
        };
        // テクスチャの表示・非表示 @@@
        pane.addBinding(parameter, 'offset', {
                min: 0.0,
                max: 1.0,
            })
            .on('change', (v) => {
                this.offset = v.value;
            });
    }

    /**
     * リサイズ処理
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * 各種リソースのロードを行う
     * @return {Promise}
     */
    load() {
        return new Promise(async (resolve, reject) => {
            const gl = this.gl;
            if (gl == null) {
                // もし WebGL コンテキストがない場合はエラーとして Promise を reject する
                const error = new Error('not initialized');
                reject(error);
            } else {
                // シェーダのソースコードを読み込みシェーダとプログラムオブジェクトを生成する
                const VSSource = await WebGLUtility.loadFile('./main.vert');
                const FSSource = await WebGLUtility.loadFile('./main.frag');
                const vertexShader = WebGLUtility.createShaderObject(gl, VSSource, gl.VERTEX_SHADER);
                const fragmentShader = WebGLUtility.createShaderObject(gl, FSSource, gl.FRAGMENT_SHADER);
                this.program = WebGLUtility.createProgramObject(gl, vertexShader, fragmentShader);

                // 画像を読み込み、テクスチャを初期化する @@@
                const imageNoKoi = await WebGLUtility.loadImage('./no-koi.jpg');
                const imageKoi = await WebGLUtility.loadImage('./koi.jpg');
                const imageMap = await WebGLUtility.loadImage('./map2.jpg');

                // テクスチャオブジェクトを生成
                const textureNoKoi = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureNoKoi);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageNoKoi);
                this.textureSetting();
                this.textureNoKoi = textureNoKoi;

                // テクスチャオブジェクトを生成
                const textureKoi = gl.createTexture();
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, textureKoi);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageKoi);
                this.textureSetting();
                this.textureKoi = textureKoi;

                // テクスチャオブジェクトを生成
                const textureMap = gl.createTexture();
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, textureMap);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageMap);
                this.textureSetting();
                this.textureMap = textureMap;

                // Promsie を解決
                resolve();
            }
        });
    }

    textureSetting() {
        const gl = this.gl;
        // ミップマップを自動生成する
        gl.generateMipmap(gl.TEXTURE_2D);
        // テクスチャパラメータを設定する
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // 安全の為にテクスチャのバインドを解除してから返す
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 頂点属性（頂点ジオメトリ）のセットアップを行う
     */
    setupGeometry() {
        // プレーンジオメトリの情報を取得
        const width = 5;
        const ratio = 2048 / 4096;
        const color = [1.0, 1.0, 1.0, 1.0];
        this.planeGeometry = WebGLGeometry.plane(width, width * ratio, color);

        // VBO と IBO を生成する
        this.planeVBO = [
            WebGLUtility.createVBO(this.gl, this.planeGeometry.position),
            WebGLUtility.createVBO(this.gl, this.planeGeometry.normal),
            WebGLUtility.createVBO(this.gl, this.planeGeometry.color),
            WebGLUtility.createVBO(this.gl, this.planeGeometry.texCoord), // テクスチャ座標 @@@
        ];
        this.planeIBO = WebGLUtility.createIBO(this.gl, this.planeGeometry.index);
    }

    /**
     * 頂点属性のロケーションに関するセットアップを行う
     */
    setupLocation() {
        const gl = this.gl;
        // attribute location の取得
        this.attributeLocation = [
            gl.getAttribLocation(this.program, 'position'),
            gl.getAttribLocation(this.program, 'normal'),
            gl.getAttribLocation(this.program, 'color'),
            gl.getAttribLocation(this.program, 'texCoord'), // テクスチャ座標 @@@
        ];
        // attribute のストライド
        this.attributeStride = [
            3,
            3,
            4,
            2, // ストライドは２ @@@
        ];
        // uniform location の取得
        this.uniformLocation = {
            mvpMatrix: gl.getUniformLocation(this.program, 'mvpMatrix'),
            normalMatrix: gl.getUniformLocation(this.program, 'normalMatrix'),
            textureUnit01: gl.getUniformLocation(this.program, 'textureUnit01'), // uniform 変数のロケーション @@@
            textureUnit02: gl.getUniformLocation(this.program, 'textureUnit02'), // uniform 変数のロケーション @@@
            textureUnit03: gl.getUniformLocation(this.program, 'textureUnit03'), // uniform 変数のロケーション @@@
            uTime: gl.getUniformLocation(this.program, 'uTime'),
            uOffset: gl.getUniformLocation(this.program, 'uOffset'),
        };
    }

    /**
     * レンダリングのためのセットアップを行う
     */
    setupRendering() {
        const gl = this.gl;
        // ビューポートを設定する
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // クリアする色と深度を設定する
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.clearDepth(1.0);
        // 色と深度をクリアする
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * 描画を開始する
     */
    start() {
        // レンダリング開始時のタイムスタンプを取得しておく
        this.startTime = Date.now();
        // レンダリングを行っているフラグを立てておく
        this.isRendering = true;
        // アニメーション開始のフラグ
        this.isAnimation = false;
        // レンダリングの開始
        this.render();
    }

    /**
     * 描画を停止する
     */
    stop() {
        this.isRendering = false;
    }

    /**
     * レンダリングを行う
     */
    render() {
        const gl = this.gl;

        // レンダリングのフラグの状態を見て、requestAnimationFrame を呼ぶか決める
        if (this.isRendering === true) {
            requestAnimationFrame(this.render);
        }

        // 現在までの経過時間
        const nowTime = (Date.now() - this.startTime) * 0.001;

        // レンダリングのセットアップ
        this.setupRendering();

        // モデル座標変換行列（ここでは特になにもモデル座標変換は掛けていない）
        const m = Mat4.identity();

        // ビュー・プロジェクション座標変換行列
        const v = this.camera.update();
        const fovy = 45;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1
        const far = 10.0;
        const p = Mat4.perspective(fovy, aspect, near, far);

        // 行列を乗算して MVP 行列を生成する（掛ける順序に注意）
        const vp = Mat4.multiply(p, v);
        const mvp = Mat4.multiply(vp, m);

        // モデル座標変換行列の、逆転置行列を生成する
        const normalMatrix = Mat4.transpose(Mat4.inverse(m));

        // テクスチャを０番ユニットにバインドする @@@
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureNoKoi);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.textureKoi);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.textureKoi);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.textureMap);

        // プログラムオブジェクトを選択し uniform 変数を更新する
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.uniformLocation.mvpMatrix, false, mvp);
        gl.uniformMatrix4fv(this.uniformLocation.normalMatrix, false, normalMatrix);
        gl.uniform1i(this.uniformLocation.textureUnit01, 0); // テクスチャユニットの番号を送る @@@
        gl.uniform1i(this.uniformLocation.textureUnit02, 1); // テクスチャユニットの番号を送る @@@
        gl.uniform1f(this.uniformLocation.uOffset, this.offset);

        if (this.isAnimation) {
            const duration = 1.0; // アニメーション秒数
            let time = ((Date.now() - this.animationTime)) * 0.001;
            gl.uniform1f(this.uniformLocation.uTime, time / duration);

            if (time > duration) {
                this.isAnimation = false;
                this.animationTime = 0;
            }
        }

        // VBO と IBO を設定し、描画する
        WebGLUtility.enableBuffer(gl, this.planeVBO, this.attributeLocation, this.attributeStride, this.planeIBO);
        gl.drawElements(gl.TRIANGLES, this.planeGeometry.index.length, gl.UNSIGNED_SHORT, 0);
    }
}