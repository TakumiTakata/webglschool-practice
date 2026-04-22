precision mediump float;

uniform sampler2D textureUnit;

varying vec4 vColor;
varying vec2 vTexCoord;


void main() {
    // テクスチャから、テクスチャ座標の色を取り出す（フラグメントシェーダーはピクセル単位で動作していることを念頭に）
    vec4 textureColor = texture2D(textureUnit, vTexCoord);

    gl_FragColor = vColor * textureColor;
}