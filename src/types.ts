

type lineDescriptor = {
    initialHeight : number
}

type dimension = {
    width : number,
    height : number
}

interface extendedDimension extends dimension {
    top : number,
    right : number
}

type zoomToolStyle = {
    top : string,
    width : string,
    height : string,
    right : string
}

type zoomToolMainButtonStyle = {
    top : string,
    height : string
}

type zoomToolBottomButtonStyle = {
    marginTop : number
}

type zoomToolInnerButtonStyle = {
    width : string,
    height : string
}

type zoomToolProps = {
    pageTotalHeight : number,
    currentScrollPosition : number,
    setCurrentScrollPosition : Function,
    setLineHeight:Function,
    style : React.CSSProperties
}

type streamCardProps = {
    todayMidnight : number,
    livestreamDesc : streamData,
    columnWidth : number,
    lineHeight : number,
    currentColumnCount : number,
    activeColumns : boolean[]
}

type streamData = {
    date : number,
    HR_date : string,
    duration : number,
    title : string,
    subtitle : string,
    thumbnail : string,
    public_page : string,
    EM_number : string,
    stream_config_URL : string,
    stream_m3u_URL : string,
    stream_channel : number,
    is_fictive : boolean
}

type RoundCheckboxProps = {
    label : number,
    currentColumnCount : number,
    activeColumns : boolean[],
    setCurrentColumnCount : Function,
    setActiveColumns : Function,
}

type settings = {
	days : number,
    initialColumnCount : number,
    headerHeight : number,
    gutterWidth : number,
	originalLineHeight : number,
    stdPadding : number,
    stdMargin : number,
    displayedHourHeight : number,
    triangleHeight : number,
    stdCardDuration : number,
    cardThumbnailImgHeight : number,
    cardThumbnailImgwidth : number,
    upcomingGridColor : string,
    zoomToolInitialSize : extendedDimension,
    zoomButtonInitialSize : dimension,
    zoomInnerButtonInitialSize : dimension
}