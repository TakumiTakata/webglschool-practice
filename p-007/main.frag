precision mediump float;

uniform sampler2D textureUnit01;
uniform sampler2D textureUnit02;

varying vec4 vColor;
varying vec2 vTexCoord;


void main() {
    // テクスチャから、テクスチャ座標の色を取り出す（フラグメントシェーダーはピクセル単位で動作していることを念頭に）
    // vec4 textureColor = texture2D(textureUnit01, vTexCoord);
    // gl_FragColor = vColor * textureColor;

    vec4 color0 = texture2D(textureUnit01, vTexCoord);
    vec4 color1 = texture2D(textureUnit02, vTexCoord);
    gl_FragColor = color0 * color1;
    // gl_FragColor = color0;

}