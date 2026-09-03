// 여러 줄 include 블록. 실제 레포(dalla)가 쓰는 형식이라 픽스처도 이 형식으로 둔다 —
// 한 줄 형식만 픽스처에 두면 정규식 결함이 초록불 뒤에 숨는다.
rootProject.name = "mini"
include(
    ":core:core_util",
    ":feature:feature_home",
)
