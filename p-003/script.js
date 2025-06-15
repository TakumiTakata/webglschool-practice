import * as THREE from '../lib/three.module.js';
import {
    OrbitControls
} from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', async () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    await app.load();
    app.init();
    app.render();
}, false)

class ThreeApp {
    /**
     * 月にかけるスケール
     */
    static MOON_SCALE = 0.27;
    /**
     * 月と地球の距離
     */
    static MOON_DISTANCE = 3.0;
    /**
     * 人工衛星の移動速度
     */
    static SATELLITE_SPEED = 0.05;
    /**
     * 人工衛星の屈曲速度
     */
    static SATELLITE_TURN_SPEED = 0.1;

    /**
     * カメラ定義のための定数
     */
    static CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 30.0,
        position: new THREE.Vector3(0.0, 2.0, 10.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    }
    /**
     * レンダラー定義のための定数
     */
    static RENDERER_PARAM = {
        clearColor: 0x333333,
        width: window.innerWidth,
        height: window.innerHeight,
    }
    /**
     * 平行光源定義のための定数
     */
    static DIREECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        position: new THREE.Vector3(1.0, 1.0, 1.0),
    }
    /**
     * 環境光定義のための定数
     */
    static AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.3,
    }
    /**
     * マテリアル定義のための定数
     */
    static MATERIAL_PARAM = {
        color: 0xcccccc,
    }
    /**
     * フォグ定時のための定数
     */
    static FOG_PARAM = {
        color: 0xffffff,
        near: 10.0,
        far: 20.0,
    };

    wrapper; // canvasの親要素
    renderer; // レンダラー
    scene; // シーン
    camera; // カメラ
    directionalLight; // 平行光源
    ambientLight; // 環境光
    controls; // オービットコントロール
    axesHelper; // アクシスヘルパー
    isDown; // キーの押下監視用フラグ

    clock; // 時間管理用
    sphereGeometry; // ジオメトリ
    earth; // 地球
    earthMaterial; // 地球用マテリアル
    earthTexture; // 地球用テクスチャ
    palne; // 飛行機
    palneMaterial; // 飛行機用マテリアル
    palneTexture; // 飛行機用テクスチャ


    /**
     * コンストラクタ
     * @constructor
     * @param {HTMLElemnt} wrapper - canvas要素をappendする親要素
     */
    constructor(wrapper) {

        // 初期化時にcanvasをappendできるようにプロパティを維持
        this.wrapper = wrapper;

        //再起呼び出しのためのthis固定
        this.render = this.render.bind(this);

        // キーの押下や離す操作を検出できるようにする
        window.addEventListener('keydown', (keyEvent) => {
            switch (keyEvent.key) {
                case ' ': // スペースキーの場合
                    this.isDown = true;
                    break;
                default:
            }
        }, false);
        window.addEventListener('keyup', (keyEvent) => {
            this.isDown = false;
        }, false);

        // ウインドウのリサイズ検知
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }, false);
    }


    /**
     * アセットのロードを行うPromise
     */
    load() {
        return new Promise((resolve) => {
            const earthPath = './earth.jpg';
            const loader = new THREE.TextureLoader();
            loader.load(earthPath, (earthTexture) => {
                this.earthTexture = earthTexture;
                resolve();
            })
        })
    }

    /**
     * 初期化処理
     */
    init() {
        // レンダラー
        const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(color);
        this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
        this.wrapper.appendChild(this.renderer.domElement);

        // シーン
        this.scene = new THREE.Scene();

        // カメラ
        this.camera = new THREE.PerspectiveCamera(
            ThreeApp.CAMERA_PARAM.fovy,
            ThreeApp.CAMERA_PARAM.aspect,
            ThreeApp.CAMERA_PARAM.near,
            ThreeApp.CAMERA_PARAM.far,
        );
        this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
        this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

        // 平行光源
        this.directionalLight = new THREE.DirectionalLight(
            ThreeApp.DIREECTIONAL_LIGHT_PARAM.color,
            ThreeApp.DIREECTIONAL_LIGHT_PARAM.intensity
        );
        this.directionalLight.position.copy(ThreeApp.DIREECTIONAL_LIGHT_PARAM.position);
        this.scene.add(this.directionalLight);

        // 環境光
        this.ambientLight = new THREE.AmbientLight(
            ThreeApp.AMBIENT_LIGHT_PARAM.color,
            ThreeApp.AMBIENT_LIGHT_PARAM.intensity
        );
        this.scene.add(this.ambientLight);

        // 軸ヘルパー
        const axesBarLength = 5.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        this.scene.add(this.axesHelper);

        // コントロール
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // this のバインド
        this.render = this.render.bind(this);
        // キーの押下状態を保持するフラグ
        this.isDown = false;
    }




    /**
     * 描画処理
     */
    render() {
        // 恒常ループ
        requestAnimationFrame(this.render); // FPS毎に自身を呼び出す

        // オービットコントロール
        this.controls.update();

        // レンダラーで描画
        this.renderer.render(this.scene, this.camera);
    }
}