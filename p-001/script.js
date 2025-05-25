import * as THREE from '../lib/three.module.js'
import { OrbitControls } from "../lib/OrbitControls.js"

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
        position: new THREE.Vector3(10.0, 10.0, 10.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    /**
     * レンダラー定義のための定数
     */
    static RENDERER_PARAM = {
        clearColor: 0x222222,
        width: window.innerWidth,
        height: window.innerHeight,
    };

    /**
     * 平行光源定義のための定数
     */
    static DIRECTIONL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.5, //強度
        position: new THREE.Vector3(1.0, 2.0, 3.0),
    };

    /**
     * アンビエントライト（環境光）定義のための定数
     */
    static AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.5, //強度
    };

    /**
     * マテリアル（質感）定義のための定数
     */
    static MATERIAL_PARAM = {
        color: 0x111111,
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
        const boxCount = 1000;
        this.boxGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        this.boxArray = [];
        let xPosition = 0;
        let zPosition = 0;
        let yPosition = 0;
        let xRotation = 0;
        let yRotation = 0;
        const postionAdd = 1.5;
        const rotationAdd = 0.02;

        for (let i = 0; i < boxCount; i++) {
            // インスタンスを生成
            const box = new THREE.Mesh(this.boxGeometry, this.material);

            // 配置を変更
            box.position.x = xPosition - (boxCount * (postionAdd / 2 * 0.01)) + (postionAdd / 2);
            box.position.z = zPosition - (boxCount * (postionAdd / 2 * 0.01)) + (postionAdd / 2);
            box.position.y = yPosition - (boxCount * (postionAdd / 2 * 0.01)) + (postionAdd / 2);
            box.rotation.y = xRotation;
            box.rotation.x = yRotation;

            if ((i + 1) % 10 === 0) {
                zPosition += postionAdd;
                xPosition = 0;
            } else {
                xPosition += postionAdd;
            }

            if ((i + 1) % 100 === 0) {
                yPosition += postionAdd;
                xPosition = 0;
                zPosition = 0;
            }

            xRotation += rotationAdd;
            yRotation += rotationAdd;


            // シーンに追加
            this.scene.add(box);

            // 配列に入れておく
            this.boxArray.push(box);
        }

        // アクシスヘルパー（軸表示）導入
        const axesBarLength = 10.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        // this.scene.add(this.axesHelper);

        // オービットコントロール（マウスで視点コントロール）導入
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        // thisのバインド
        this.render = this.render.bind(this);


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

        this.boxArray.forEach((box) => {
            box.rotation.y += 0.02;
            box.rotation.z += 0.02;
        });

        //  レンダラーで描画
        this.renderer.render(this.scene, this.camera);

    }
}