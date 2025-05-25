import { PerspectiveCamera } from "../lib/three.core.js";
import * as THREE from '../lib/three.module.js'
import {
    OrbitControls
} from "../lib/OrbitControls.js"

window.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    app.render();
}, false);

class ThreeApp {
    /**
     * カメラ定義のための定数
     */
    static CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 100.0,
        position: new THREE.Vector3(0.0, 2.0, 10.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    /**
     * レンダラー定義のための定数
     */
    static RENDERER_PARAM = {
        clearColor: 0x333333,
        width: window.innerWidth,
        height: window.innerHeight,
    };

    /**
     * 平行光源定義のための定数
     */
    static DIRECTIONL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,     //強度
        position: new THREE.Vector3(1.0, 1.0, 1.0),
    };

    /**
     * アンビエントライト（環境光）定義のための定数
     */
    static AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.1,     //強度
    };

    /**
     * マテリアル（質感）定義のための定数
     */
    static MATERIAL_PARAM = {
        color: 0x3399ff,
    };

    renderer;
    scene;
    camera;
    directionalLight;
    ambientLight;
    material;
    torusGeometry;
    torusArray;
    orbitControls;
    axesHelper;
    isDown;

    /**
     * コンストラクタ
     * @constructor
     * @param {HTMElement} wrapper - canvas 要素を appendする親要素
     */
    constructor(wrapper) {

        // レンダラー
        const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor)
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(color);
        this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
        wrapper.appendChild(this.renderer.domElement)

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

        // ディレクショナルライト（平行光源）
        this.directionaLight = new THREE.DirectionalLight(
            ThreeApp.DIRECTIONL_LIGHT_PARAM.color,
            ThreeApp.DIRECTIONL_LIGHT_PARAM.intensity
        );
        this.directionaLight.position.copy(ThreeApp.DIRECTIONL_LIGHT_PARAM.position);
        this.scene.add(this.directionaLight);

        // アンビエントライト（環境光）
        this.ambientLight = new THREE.AmbientLight(
            ThreeApp.AMBIENT_LIGHT_PARAM.color,
            ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
        );
        this.scene.add(this.ambientLight);

        // マテリアル（質感）
        this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);

        // 共通のジオメトリ、マテリアルから複数のメッシュインスタンスを作成
        const torusCount = 10; // 円環の数
        const transformScale = 4.0 // ランダム感の大きさ
        this.torusGeometry = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
        this.torusArray = []; // 円環が入る空の配列
        for ( let i = 0; i < torusCount; i++) {
            // 円環のインスタンスを生成
            const torus = new THREE.Mesh(this.torusGeometry, this.material);

            // ランダムな位置に配置
            torus.position.x = (
                Math.random()       // 0~1のランダムな数値
                * 2.0               // 0~2の範囲に
                - 1.0)              // -1~1の範囲に。これで中心点からランダムになる
                * transformScale;   // ランダム感の大きさをかける。
            torus.position.y = (Math.random() * 2.0 - 1.0) * transformScale;
            torus.position.z = (Math.random() * 2.0 - 1.0) * transformScale;

            // シーンに追加
            this.scene.add(torus);

            // 配列に入れておく
            this.torusArray.push(torus);
        }

        // アクシスヘルパー（軸表示）導入
        const axesBarLength = 5.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        this.scene.add(this.axesHelper);

        // オービットコントロール（マウスで視点コントロール）導入
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        // thisのバインド
        this.render = this.render.bind(this);

        // キーの押下状態を保持するフラグ
        this.inDown = false;

        // キーの押下を検知
        window.addEventListener('keydown', (keyEvent) => {
            switch (keyEvent.key) {
                case ' ':
                    this.isDown = true;
                    break;
                default:
            }
        }, false);

        // キーを離すとフラグ回収
        window.addEventListener('keyup', (keyEvent) => {
            this.isDown = false;
        }, false);

        // 画面幅のリサイズでレンダラー、カメラの更新
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }, false);

    }

    /**
     * 描画処理
     */
    render() {
        // 恒常ループの設定 モニターのfpsに合わせて描画する
        requestAnimationFrame(this.render);

        // オービットコントロールを更新
        this.orbitControls.update();

        // キーダウンのフラグに応じてオブジェクトの状態を変化
        if(this.isDown === true) {
            // Y軸に回転
            this.torusArray.forEach((torus) => {
                torus.rotation.y += 0.05;
            });
        }

        //  レンダラーで描画
        this.renderer.render(this.scene, this.camera);

    }
}