// シチュエーションボイス台本データ
// Fish Audio S2 タグ([soft][breathy][moaning]等)をそのまま含む。
// テキストが空の step = [long pause] の無音ポーズ(holdSec秒の無音待機)。

export const RAIN_NIGHT = {
  id: 'rain-night',
  title: '年上の彼女・雨の夜',
  description: '雨の夜、年上の彼女に誘われて',
  voiceKey: 'SITU_A',
  blocks: [
    {
      id: 'intro',
      name: '1. 導入',
      steps: [
        { text: '[soft]来てくれたんだ。……びしょ濡れじゃない。[breathy]ふふ、いいよ、そのままで。', holdSec: 0, chime: false },
        { text: '[whispering]ねえ……今日は、ずっとこうしたかったの。[breathy]あなたが来るって思ったら、もう、待てなくて。', holdSec: 0, chime: false },
        { text: '[soft]脱がせて。……ううん、私が脱がせてあげる。[breathy]じっとしてて。', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'foreplay',
      name: '2. 前戯',
      steps: [
        { text: '[breathy]ん……キス、上手になったね。[soft]もっと、深くして。', holdSec: 0, chime: false },
        { text: '[breathy][soft]首、弱いの……あっ、そこ、んっ……', holdSec: 0, chime: false },
        { text: '[soft]ねえ、気づいてる?[breathy]もう、こんなに濡れてるの。……触ってみて。', holdSec: 0, chime: false },
        { text: '[breathy]ん、っ……[soft]そう、そこ……指、もう少し奥……あぁ……', holdSec: 0, chime: false },
        { text: '[panting]はぁ……っ、上手、すごく上手……[moaning]あっ、んっ……', holdSec: 0, chime: false },
        { text: '[breathy][whispering]待って、それ以上されたら……[moaning]んんっ、いっちゃう……', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'tease',
      name: '3. 焦らし',
      steps: [
        { text: '[soft]ふふ、今度は私の番。[breathy]じっとしててね。', holdSec: 0, chime: false },
        { text: '[breathy]ここ、もうこんなに硬い……[whispering]私のこと、欲しがってくれてるんだ。', holdSec: 0, chime: false },
        { text: '[soft]あんまり可愛い反応するから……[breathy]いじめたくなっちゃう。', holdSec: 0, chime: false },
        { text: '[panting]……ね、もう、限界でしょ?[breathy]私も、おんなじ。', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'sex',
      name: '4. 挿入',
      steps: [
        { text: '[breathy]来て。……ゆっくり、でいいから。[soft]あぁ……入って、くる……', holdSec: 0, chime: false },
        { text: '[moaning]んあぁっ……[panting]はぁ、っ、全部、入った……', holdSec: 0, chime: false },
        { text: '[breathy]動いて。……あなたの好きなように、して。[soft]あっ……ん、っ……', holdSec: 0, chime: false },
        { text: '[panting]あっ、あっ、[moaning]あぁっ、そこ、そこ気持ちいい……[emphasis]もっと……', holdSec: 0, chime: false },
        { text: '[moaning][panting]んっ、あ、あぁっ……奥、当たってる……[groaning]んんっ……', holdSec: 0, chime: false },
        { text: '[panting]はぁっ、はぁっ、[whispering]すごい……壊れちゃう……', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'climax',
      name: '5. クライマックス',
      steps: [
        { text: '[panting]だめ、っ、もう……[moaning]いく、いっちゃう……一緒に、来て……', holdSec: 0, chime: false },
        { text: '[moaning][panting]あっ、あっ、あぁっ……[emphasis]いま、いまっ……', holdSec: 0, chime: false },
        { text: '[moaning][groaning]んあぁぁっ……——っ！', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'aftertalk',
      name: '6. 余韻',
      steps: [
        { text: '[breathy]はぁ……はぁ……[soft]すごかった……ね。', holdSec: 0, chime: false },
        { text: '[breathy][whispering]ぎゅってして。……もう少し、このまま。', holdSec: 0, chime: false },
        { text: '[soft]ふふ……やっぱり、あなたには敵わないな。[breathy]……大好き。', holdSec: 0, chime: false },
      ],
    },
  ],
};

export const KOUHAI = {
  id: 'kouhai',
  title: '年下の後輩・責められる夜',
  description: '後輩に主導権を握られた夜',
  voiceKey: 'SITU_B',
  blocks: [
    {
      id: 'takeover',
      name: '1. 主導権',
      steps: [
        { text: '[soft]先輩、今日は逃がしませんから。[breathy]ずっと、こうしたかったんです。', holdSec: 0, chime: false },
        { text: '[whispering]後輩だからって、子ども扱いしないでくださいね。[soft]私だって、もう大人なんですから。', holdSec: 0, chime: false },
        { text: '[breathy]ほら、動かないで。……今日は、私が先輩を気持ちよくしてあげる番。', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'tease',
      name: '2. 焦らし・責め',
      steps: [
        { text: '[soft]ふふ、耳まで赤い。[breathy]先輩でも、こんな顔するんですね。', holdSec: 0, chime: false },
        { text: '[whispering]ここ……もう、こんなに反応してる。[soft]私に触られて、嬉しいですか?', holdSec: 0, chime: false },
        { text: '[breathy]だめですよ、まだ。[soft]ちゃんと、おねだりしてくれないと。', holdSec: 0, chime: false },
        { text: '[breathy][whispering]ね……言って、先輩。[soft]欲しいって。', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'foreplay',
      name: '3. 前戯',
      steps: [
        { text: '[soft]よくできました。[breathy]ご褒美、あげますね。', holdSec: 0, chime: false },
        { text: '[breathy]ん……先輩の声、もっと聞かせて。[soft]我慢しなくて、いいんですよ。', holdSec: 0, chime: false },
        { text: '[panting]はぁ……っ、私も、もう……[breathy]先輩に触られてないのに、こんなになっちゃった。', holdSec: 0, chime: false },
        { text: '[breathy][soft]ねえ、確かめてみてください。……ほら、ぐしょぐしょ。', holdSec: 0, chime: false },
        { text: '[moaning]んっ、あぁ……そこ、先輩の指、上手……[panting]はぁっ……', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'sex',
      name: '4. 挿入',
      steps: [
        { text: '[breathy]今日は私が上で、します。[soft]先輩は、寝てるだけでいいから。', holdSec: 0, chime: false },
        { text: '[moaning]んあぁっ……[panting]はぁ、っ、入った……先輩の、奥まで……', holdSec: 0, chime: false },
        { text: '[breathy]動きますね。……あっ、ん、っ……[moaning]自分で動くの、恥ずかし、っ……', holdSec: 0, chime: false },
        { text: '[panting]あっ、あっ、[moaning]あぁっ、当たってる……先輩の、形、わかっちゃう……', holdSec: 0, chime: false },
        { text: '[moaning][panting]んっ、あ、あぁっ……だめ、声、止まらな……[groaning]んんっ……', holdSec: 0, chime: false },
        { text: '[panting]先輩も、気持ちいい?[breathy]私の中、好き……?', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'climax',
      name: '5. クライマックス',
      steps: [
        { text: '[panting]だめ、もう……[moaning]いっちゃう、先輩、一緒に……', holdSec: 0, chime: false },
        { text: '[moaning][panting]あっ、あっ、あぁっ……[emphasis]中に、ください……', holdSec: 0, chime: false },
        { text: '[moaning][groaning]んあぁぁっ……——っ！', holdSec: 0, chime: false },
        { text: '', holdSec: 8, chime: false },
      ],
    },
    {
      id: 'aftertalk',
      name: '6. 余韻',
      steps: [
        { text: '[breathy]はぁ……はぁ……[soft]すごかった……です。', holdSec: 0, chime: false },
        { text: '[breathy][whispering]……ぎゅって、してください。[soft]責めたのに、結局、甘えたくなっちゃった。', holdSec: 0, chime: false },
        { text: '[soft]ふふ。……先輩のこと、独り占めしたいな。[breathy]……好きです。', holdSec: 0, chime: false },
      ],
    },
  ],
};

export const SITU_SCRIPTS = [RAIN_NIGHT, KOUHAI];
