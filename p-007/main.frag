precision mediump float;

uniform sampler2D textureUnit01;
uniform sampler2D textureUnit02;
uniform sampler2D textureUnit03;

varying vec4 vColor;
varying vec2 vTexCoord;
varying float vTime;
varying float vOffset;

const float displacementCoef = 0.2;


void main() {
    // テクスチャから、テクスチャ座標の色を取り出す（フラグメントシェーダーはピクセル単位で動作していることを念頭に）
    // vec4 color0 = texture2D(textureUnit01, vTexCoord);
    // vec4 color1 = texture2D(textureUnit02, vTexCoord);

    // gl_FragColor = mix(color0, color1, vTime);


    // 歪み用テクスチャ
    vec4 displacemantTexture = texture2D(textureUnit03, vTexCoord);

    
    float displaceForce1 = displacemantTexture.r * vTime * displacementCoef;
    vec2 uvDisplaced1 = vec2(vTexCoord.x + displaceForce1, vTexCoord.y + displaceForce1);
    vec4 displacedTexture1 = texture2D(textureUnit01, uvDisplaced1);

    float displaceForce2 = displacemantTexture.r * (1.0 - vTime) * displacementCoef;
    vec2 uvDisplaced2 = vec2(vTexCoord.x + displaceForce2, vTexCoord.y + displaceForce2);
    vec4 displacedTexture2 = texture2D(textureUnit02, uvDisplaced2);

    gl_FragColor = (displacedTexture1 * (1.0 - vTime) + displacedTexture2 * vTime);
}