import { WebGLUtility } from '../lib/webgl.js';
import { Vec3, Mat4 } from '../lib/math.js';
import { WebGLGeometry } from '../lib/geometry.js';
import { WebGLOrbitCamera } from '../lib/camera.js';
import { Pane } from '../lib/tweakpane-4.0.3.min.js';

window.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    app.init();
    await app.load();
    app.setupGeometry();
    app.setupLocation();
    app.start();

    // Tweakpane を使った GUI の設定
    const pane = new Pane();
    const parameter = {
        culling: true,
        depthTest: true,
        rotation: false,
    };
    pane.addBinding(parameter, 'culling').on('change', (v) => {
        app.setCulling(v.value);
    });
    pane.addBinding(parameter, 'depthTest').on('change', (v) => {
        app.setDepthTest(v.value);
    });
    pane.addBinding(parameter, 'rotation').on('change', (v) => {
        app.setRotation(v.value);
    });

}, false);

/**
 * アプリケーション管理クラス
 */
class App {
    canvas;
    gl;
    program;
    attributeLocation;
    attributeStride;
    torusGeometry;
    torusVBO;
    torusIBO;
    uniformLocation;
    startTime;
    isRendering;
    isRotation;
    camera;

    constructor() {
        // thisを固定するためのバインド処理
        this.resize = this.resize.bind(this);
        this.render = this.render.bind(this);
    }

    /**
     * バックフェイスカリングを設定する @@@
     * @param {boolean} flag - 設定する値
     */
    setCulling(flag) {
        const gl = this.gl;
        if (gl == null) {return;}
        if (flag === true) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }
    }

    /**
     * 深度テストを設定する @@@
     * @param {boolean} flag - 設定する値
     */
    setDepthTest(flag) {
        const gl = this.gl;
        if (gl == null) {return;}
        if (flag === true) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
    }

    /**
     * isRotation を設定する @@@
     * @param {boolean} flag - 設定する値
     */
    setRotation(flag) {
        this.isRotation = flag;
    }

    /**
     * 初期化処理を行う
     */
    init() {
        this.canvas = document.getElementById('webgl-canvas');
        this.gl = WebGLUtility.createWebGLContext(this.canvas); // WebGLコンテキスト初期化

        const cameraOption = {
            distance: 5.0,
            min: 1.0,
            max: 10.0,
            move: 2.0,
        };
        this.camera = new WebGLOrbitCamera(this.canvas, cameraOption);

        this.resize(); //初回描画用に先にリサイズ
        window.addEventListener('resize', this.resize, false);

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
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
            if ( gl == null)  {
                const error = new Error('not initialized');
                reject(error);
            } else {
                // 各ソースファイルの読み込みを待つ
                const VSSource = await WebGLUtility.loadFile('./main.vert');
                const FSSource = await WebGLUtility.loadFile('./main.frag');

                const vertexShader = WebGLUtility.createShaderObject(gl, VSSource, gl.VERTEX_SHADER);
                const fragmentShader = WebGLUtility.createShaderObject(gl, FSSource, gl.FRAGMENT_SHADER);
                this.program = WebGLUtility.createProgramObject(gl, vertexShader, fragmentShader);
                resolve();
            }
        })
    }

    /**
     *  頂点属性のセットアップ
     */
    setupGeometry() {
        const row = 256;
        const column = 4;
        const innerRadius = 0.4;
        const outerRadius = 0.8;
        const color = [1.0, 1.0, 1.0, 1.0];
        this.torusGeometry = WebGLGeometry.torus(
            row,
            column,
            innerRadius,
            outerRadius,
            color,
        );

        // VBOの生成　
        this.torusVBO = [
            WebGLUtility.createVBO(this.gl, this.torusGeometry.position), // 座標
            WebGLUtility.createVBO(this.gl, this.torusGeometry.normal), // 法線
            WebGLUtility.createVBO(this.gl, this.torusGeometry.color), // 色
        ];

        // IBOの生成
        this.torusIBO = WebGLUtility.createIBO(this.gl, this.torusGeometry.index);
    }

    /**
     * 頂点属性のロケーションに関するセットアップを行う
     */
    setupLocation() {
        const gl = this.gl;
        this.attributeLocation = [
            gl.getAttribLocation(this.program, 'position'),
            gl.getAttribLocation(this.program, 'normal'),
            gl.getAttribLocation(this.program, 'color'),
        ];
        this.attributeStride = [
            3,
            3,
            4,
        ];
        this.uniformLocation = {
            mvpMatrix: gl.getUniformLocation(this.program, 'mvpMatrix'),
            normalMatrix: gl.getUniformLocation(this.program, 'normalMatrix'),
        };
    }

    /**
     * レンダリングのためのセットアップを行う
     */
    setupRendering() {
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * 描画開始
     */
    start() {
        this.startTime = Date.now();
        this.isRendering = true;
        this.render();
    }

    /**
     * 描画停止
     */
    stop() {
        this.isRendering = false;
    }

    /**
     * レンダリングを行う
     */
    render() {
        const gl = this.gl;

        if(this.isRendering === true) {
            requestAnimationFrame(this.render);
        }

        const nowTime = (Date.now() - this.startTime) * 0.001;

        this.setupRendering();

        // モデル座標変換行列
        const rotateAxis = Vec3.create(0.0, 1.0, 0.0);
        const m = this.isRotation === true ?
            Mat4.rotate(Mat4.identity(), nowTime, rotateAxis) :
            Mat4.identity();

        // ビュー・プロジェクション座標変換行列
        const v = this.camera.update();
        const fovy = 45;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 10.0;
        const p =  Mat4.perspective(fovy, aspect, near, far);

        // 行列を乗算してMVP行列を生成
        const  vp = Mat4.multiply(p, v);
        const  mvp = Mat4.multiply(vp, m);

        // モデル座標変換行列の、逆転置行列を生成
        const normalMatrix = Mat4.transpose(Mat4.inverse(m));

        // プログラムオブジェクトを選択し uniform 変数を更新する
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.uniformLocation.mvpMatrix, false, mvp);
        gl.uniformMatrix4fv(this.uniformLocation.normalMatrix, false, normalMatrix);

        // VBO と IBO を設定し、描画する
        WebGLUtility.enableBuffer(gl, this.torusVBO, this.attributeLocation, this.attributeStride, this.torusIBO);
        gl.drawElements(gl.TRIANGLES, this.torusGeometry.index.length, gl.UNSIGNED_SHORT, 0);
    }
}