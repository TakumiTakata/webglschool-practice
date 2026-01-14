import * as THREE from '../lib/three.module.js';
import {
    OrbitControls
} from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', async () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    app.init();
    app.render();
}, false)

class ThreeApp {
    /**
     * 人工衛星の距離
     */
    static PLANE_DISTANCE = 3.5;
    /**
     * 人工衛星の回転周期（秒）
     */
    static PLANE_ROTATION_PERIOD = 8.0;
    /**
     * 👀の距離
     */
    static EYES_DISTANCE = 3.2;

    /**
     * カメラ定義のための定数
     */
    static CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 30.0,
        position: new THREE.Vector3(0.0, 0.0, 12.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    }
    /**
     * レンダラー定義のための定数
     */
    static RENDERER_PARAM = {
        clearColor: 0x111111,
        width: window.innerWidth,
        height: window.innerHeight,
    }
    /**
     * 平行光源定義のための定数
     */
    static DIREECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 3.0,
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
    static EARTH_MATERIAL_PARAM = {
        color: 0x6A6AFF,
    }
    // static DIAMOND_MATERIAL_PARAM = {
    //     color: 0xFF966A,
    // }
    static PLANE_MATERIAL_PARAM = {
        color: 0xeeeeee,
    }
    static EYE_MATERIAL_PARAM = {
        color: 0xffffff,
    }
    static SPHERE_MATERIAL_PARAM = {
        color: 0xffffff,
        transparent: true, // 透明を扱うかどうか
        opacity: 0.0, // 透明度
        side: THREE.DoubleSide, // 描画する面（バックフェイスカリングの設定）
    }
    /**
     * フォグ定時のための定数
     */
    static FOG_PARAM = {
        color: 0xffffff,
        near: 10.0,
        far: 20.0,
    };

    // 目の回転限度
    static EYES_ROTATION_LIMIT_PERCENT = 0.65;
    // 目の回転遅延補間係数
    static EYES_ROTATION_LERP_FACTOR = 0.07;
    // 色の変化時間（ミリ秒）
    static COLOR_CHANGE_DURATION = 300;

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
    earth; // 地球
    earthWrapper; // 地球
    earthGeometry; // 地球用ジオメトリ
    earthMaterial; // 地球用マテリアル
    earthTexture; // 地球用テクスチャ
    diamond;
    diamondGeometry;
    diamondMaterial;
    diamondArray;
    diamondColorArray;
    diamondGroup;
    palne; // 飛行機
    palneGeometry; // 飛行機用ジオメトリ
    palneMaterial; // 飛行機用マテリアル
    eyeGeometryHalfCircle; // 片目用ジオメトリ
    eyeGeometryPanel; // 片目用ジオメトリ
    eyeMaterial; // 片目用マテリアル
    eyesArray;
    eyesSphere;
    eyesSphereMaterial;
    eyesGroup; // 両目グループ
    eyesWrapper; // 両目グループ
    eyesVector;
    pointerVector;
    subVector;
    targetRotation; // 目標回転値
    raycaster; // レイキャスター
    hitMaterial;
    targetColor; // 目標色（アニメーション用）
    startColor; // 色変化の開始色
    colorChangeStartTime; // 色変化の開始時刻（ミリ秒）



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

        // レイキャスター
        this.raycaster = new THREE.Raycaster();

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

        this.pointerVector = new THREE.Vector2();
        this.subVector = new THREE.Vector2();
        this.targetRotation = new THREE.Vector2();

        window.addEventListener('pointermove', (pointerEvent) => {
            const pointerX = pointerEvent.clientX;
            const pointerY = pointerEvent.clientY;

            // 画面中央を起点にした -1.0 ~ 1.0 に変換
            const scaleX = pointerX / window.innerWidth * 2.0 - 1.0;
            const scaleY = pointerY / window.innerHeight * 2.0 - 1.0;

            this.pointerVector.set(
                scaleX,
                scaleY
            )

            this.subVector.subVectors(this.pointerVector, this.eyesVector);

        }, false);


        // ウインドウのリサイズ検知
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }, false);
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


        // 地球のメッシュ作成
		const earthScale = 2.6;
        this.earthGeometry = new THREE.SphereGeometry(earthScale, 32, 32);
        this.earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.EARTH_MATERIAL_PARAM);
        // this.earthMaterial.map = this.earthTexture;
        this.earth = new THREE.Mesh(this.earthGeometry, this.earthMaterial);
        this.earthWrapper = new THREE.Group();
        this.earthWrapper.add(this.earth);
        this.scene.add(this.earthWrapper);
        this.earthWrapper.rotation.z = (360 / -23.4) * (Math.PI / 180);

        // ダイヤのメッシュ作成
        const diamondRadius = 0.8;
        this.diamondGeometry = new THREE.OctahedronGeometry(diamondRadius);
        this.diamondHitMaterial = new THREE.MeshPhongMaterial(ThreeApp.DIAMOND_HIT_MATERIAL_PARAM);
		this.diamondArray = [];
		this.diamondGroup = new THREE.Group();
        this.diamondColorArray = [];
        let colorHue = 0;
        let baseColor = new THREE.Color("hsl(0, 100%, 71%)")
		const diamondCount = 12;

		for (let i = 0; i < diamondCount; i++) {
            colorHue = colorHue + (360 / diamondCount);
            baseColor = new THREE.Color("hsl(" + colorHue + ", 100%, 71%)")
            this.diamondColorArray.push(baseColor);
        }

		for (let i = 0; i < diamondCount; i++) {

            this.diamondMaterial = new THREE.MeshPhongMaterial({color:this.diamondColorArray[i]});
			this.diamond = new THREE.Mesh(this.diamondGeometry, this.diamondMaterial);
			const radian = i / diamondCount * Math.PI * 2;
			this.diamond.position.x = (earthScale * 1.75) * Math.cos(radian);
            this.diamond.position.y = (earthScale * 1.75) * Math.sin(radian);
            this.diamond.position.z = 0;

			this.diamond.rotation.y += 0.015;

			this.diamondGroup.add(this.diamond);
            this.diamondArray.push(this.diamond);
		}
        this.scene.add(this.diamondGroup);


        // 飛行機のメッシュ作成
        // this.planeGeometry = new THREE.ConeGeometry(0.2, 0.4, 32);
        const planeRadius = 0.2;
        this.planeGeometry = new THREE.SphereGeometry(planeRadius, 32, 32);
        this.planeMaterial = new THREE.MeshPhongMaterial(ThreeApp.PLANE_MATERIAL_PARAM);
        this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
        // this.plane.position.y = ThreeApp.PLANE_DISTANCE - planeRadius;
        // this.scene.add(this.plane);

        // 👀のメッシュ作成準備
        this.eyeGeometryHalfCircle = new THREE.CircleGeometry(0.1, 32, 0, Math.PI);
        this.eyeGeometryPanel = new THREE.PlaneGeometry(0.2, 0.3);
        this.eyeMaterial = new THREE.MeshBasicMaterial(ThreeApp.EYE_MATERIAL_PARAM);

        this.eyesSphereMaterial = new THREE.MeshPhongMaterial(ThreeApp.SPHERE_MATERIAL_PARAM);
        this.eyesSphere = new THREE.Mesh(this.earthGeometry, this.eyesSphereMaterial);

        this.eyesGroup = new THREE.Group();
        this.eyesWrapper = new THREE.Group();
        this.eyesWrapper.add(this.eyesSphere);
        this.eyesArray = [];

        // 👀のメッシュ作成
        for (let i = 0; i < 2; ++i) {
            const eye = new THREE.Group();
            const eyeHalfCircleTop = new THREE.Mesh(this.eyeGeometryHalfCircle, this.eyeMaterial);
            const eyeHalfCircleBottom = new THREE.Mesh(this.eyeGeometryHalfCircle, this.eyeMaterial);
            const eyePanel = new THREE.Mesh(this.eyeGeometryPanel, this.eyeMaterial);

            eyeHalfCircleTop.position.y = 0.15;
            eyeHalfCircleBottom.position.y = -0.15;
            eyeHalfCircleBottom.rotation.z = Math.PI;

            eye.add(eyeHalfCircleTop)
            eye.add(eyeHalfCircleBottom)
            eye.add(eyePanel)

            if (i === 0) {
                eye.position.x = 0.2;
            } else {
                eye.position.x = -0.2;
            }

            this.eyesGroup.add(eye);
            this.eyesArray.push(eye);
        }

        this.eyesGroup.position.set(0.0, 0.0, ThreeApp.EYES_DISTANCE);
        this.eyesWrapper.add(this.eyesGroup);
        this.scene.add(this.eyesWrapper);

        // 👀の回転初期値を設定
        this.eyesVector = new THREE.Vector2(
            this.eyesWrapper.rotation.x,
            this.eyesWrapper.rotation.y
        );



        // clockオブジェクトを生成
        this.clock = new THREE.Clock();


        // 軸ヘルパー
        const axesBarLength = 5.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        // this.scene.add(this.axesHelper);

        // コントロール
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // this のバインド
        this.render = this.render.bind(this);
        // キーの押下状態を保持するフラグ
        this.isDown = false;

        // 目標色の初期値を設定（地球の現在の色）
        this.targetColor = this.earth.material.color.clone();
        // 開始色の初期値を設定
        this.startColor = this.earth.material.color.clone();
        // 色変化の開始時刻を初期化
        this.colorChangeStartTime = null;

        // クリックイベントリスナー
        window.addEventListener('click', (mouseEvent) => {
            const x = mouseEvent.clientX / window.innerWidth * 2.0 - 1.0;
            const y = mouseEvent.clientY / window.innerHeight * 2.0 - 1.0;
            const v = new THREE.Vector2(x, -y);
            this.raycaster.setFromCamera(v, this.camera);
            const intersects = this.raycaster.intersectObjects(this.diamondArray);
            this.earth.material = this.earthMaterial;

            if (intersects.length > 0) {
                this.hitMaterial = intersects[0].object.material;
                // 開始色を現在の色に設定
                this.startColor = this.earth.material.color.clone();
                // 目標色を設定（段階的にこの色に近づく）
                this.targetColor = this.hitMaterial.color.clone();
                // 色変化の開始時刻を記録
                this.colorChangeStartTime = performance.now();
            }
        }, false);
    }




    /**
     * 描画処理
     */
    render() {
        // 恒常ループ
        requestAnimationFrame(this.render); // FPS毎に自身を呼び出す

        // オービットコントロール
        // this.controls.update();

        const time = this.clock.getElapsedTime();
        // 回転周期を考慮した時間計算（2π / 周期秒 で角速度を調整）
        const rotateSpeed = time * (2 * Math.PI / ThreeApp.PLANE_ROTATION_PERIOD);

        this.plane.position.set(
            Math.cos(rotateSpeed) * ThreeApp.PLANE_DISTANCE,
            Math.sin(rotateSpeed) * ThreeApp.PLANE_DISTANCE,
            0.0
        );

        this.earth.rotation.y += 0.006;

		this.diamondArray.forEach(element => {
			element.rotation.y += 0.01;
		});

        // 目標回転値を計算
        this.targetRotation.set(
            this.subVector.x * ThreeApp.EYES_ROTATION_LIMIT_PERCENT,
            this.subVector.y * ThreeApp.EYES_ROTATION_LIMIT_PERCENT
        );

        // 現在の回転値から目標回転値へ線形補間で遅延更新
        this.eyesWrapper.rotation.y = THREE.MathUtils.lerp(
            this.eyesWrapper.rotation.y,
            this.targetRotation.x,
            ThreeApp.EYES_ROTATION_LERP_FACTOR
        );
        this.eyesWrapper.rotation.x = THREE.MathUtils.lerp(
            this.eyesWrapper.rotation.x,
            this.targetRotation.y,
            ThreeApp.EYES_ROTATION_LERP_FACTOR
        );

        // 色を段階的に目標色に近づける（指定時間内で変化）
        if (this.colorChangeStartTime !== null) {
            const elapsed = performance.now() - this.colorChangeStartTime;
            const alpha = Math.min(elapsed / ThreeApp.COLOR_CHANGE_DURATION, 1.0);

            // 開始色から目標色への補間
            const currentColor = this.startColor.clone();
            currentColor.lerp(this.targetColor, alpha);
            this.earth.material.color.copy(currentColor);

            // アニメーション完了後、開始時刻をリセット
            if (alpha >= 1.0) {
                this.colorChangeStartTime = null;
            }
        }

        // レンダラーで描画
        this.renderer.render(this.scene, this.camera);
    }
}