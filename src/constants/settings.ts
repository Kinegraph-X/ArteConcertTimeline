import '../types.ts';

const settings:settings = {
	days : 3,
	previousVisibleHours : 5,
	initialColumnCount : 4,
	hourSubdivisions : 6,
	headerHeight : 49,
	originalLineHeight : 124,
	gutterWidth : 84,
	stdPadding : 1,
	stdMargin : 12,
	displayedHourHeight : 46,
	triangleHeight : 12,
	stdCardDuration : 110 * 60,
	cardThumbnailImgwidth : 380,
	cardThumbnailImgHeight : 214,
	zoomToolInitialSize : {
		top : 64,
		right : 24,
		width : 28,
		height : 757,
	},
	zoomButtonInitialSize : {width : 0, height : 0},
	zoomInnerButtonInitialSize : {width : 0, height : 0}
};

settings.zoomButtonInitialSize = {
	width : settings.zoomToolInitialSize.width - settings.stdPadding * 2,
	height : settings.zoomToolInitialSize.height - settings.stdPadding * 2
};
settings.zoomInnerButtonInitialSize = {
	width : 24 - settings.stdPadding * 2,
	height : 20
};

export default settings;