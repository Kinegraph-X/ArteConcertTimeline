import './types.ts';
import { useState, useLayoutEffect, useEffect } from 'react';
import settings from './constants/settings.ts';

let initialZoomLevel:number,
    buttonTopCoordState:number = 0,
    middleClickOffset:number,
    tempButtonHeight:number,
    lastClickMoveOffset:number,
    currentScrollingAvailableSize:number,
    componentProps:zoomToolProps,
    buttonTopCoord:number,
    setButtonTopCoord:Function,
    zoomLevel:number,
    setZoomLevel:Function;

const scrollMoveHandler = (moveEvent:MouseEvent) => {
    buttonTopCoordState = moveEvent.clientY - middleClickOffset;
    
    const currentPercentage = buttonTopCoordState / currentScrollingAvailableSize;
    if (buttonTopCoordState >= 0 && buttonTopCoordState <= currentScrollingAvailableSize) {
        setButtonTopCoord(buttonTopCoordState);
        componentProps.setCurrentScrollPosition((componentProps.pageTotalHeight - window.innerHeight) * currentPercentage);
    }
}

const bottomZoomMoveHandler = (moveEvent:MouseEvent) => {
    const moveOffset = moveEvent.clientY - lastClickMoveOffset;
    if (buttonTopCoordState >= 0)
        tempButtonHeight += moveOffset * 2;
    else
        tempButtonHeight += moveOffset;
    const newZoomLevel = settings.zoomButtonInitialSize.height / tempButtonHeight;
    if (newZoomLevel >= 1 && tempButtonHeight > settings.zoomInnerButtonInitialSize.height * 3) {
        if (buttonTopCoordState >= 0) {
            buttonTopCoordState -= moveOffset;
            setButtonTopCoord(buttonTopCoordState)
        }
        
        setZoomLevel(newZoomLevel);
        const zoomChangeRatio = newZoomLevel / initialZoomLevel;
        componentProps.setLineHeight(settings.originalLineHeight * zoomChangeRatio);

        updateScrollWhenZoom(newZoomLevel);
    }
    lastClickMoveOffset += moveOffset;
}

const topZoomMoveHandler = (moveEvent:MouseEvent) => {
    const moveOffset = moveEvent.clientY - lastClickMoveOffset;
    if (buttonTopCoordState + tempButtonHeight <= settings.zoomToolInitialSize.top + settings.zoomToolInitialSize.height - settings.stdPadding * 2)
        tempButtonHeight += -moveOffset * 2;
    else
        tempButtonHeight += -moveOffset;
    const newZoomLevel = settings.zoomButtonInitialSize.height / tempButtonHeight;
    if (newZoomLevel >= 1 && tempButtonHeight > settings.zoomInnerButtonInitialSize.height * 3) {
        if (buttonTopCoordState >= 0) {
            buttonTopCoordState += moveOffset;
            setButtonTopCoord(buttonTopCoordState)
        }
        setZoomLevel(newZoomLevel);
        componentProps.setLineHeight(settings.originalLineHeight * newZoomLevel / initialZoomLevel)

        updateScrollWhenZoom(newZoomLevel);
    }
    lastClickMoveOffset += moveOffset;
}

const updateScrollWhenZoom = function(newZoomLevel:number) {
    const scrollChangeRatio = newZoomLevel / zoomLevel;
    let newScroll = (componentProps.currentScrollPosition + window.innerHeight / 2) * scrollChangeRatio - window.innerHeight / 2;
    if (newScroll > 0) {
        if (newScroll > componentProps.pageTotalHeight - window.innerHeight)
            newScroll = (componentProps.currentScrollPosition + window.innerHeight) * scrollChangeRatio - window.innerHeight;
        componentProps.setCurrentScrollPosition(newScroll);
    }
}

const handleZoomToolMiddleButtonOnMouseDown = (e:React.MouseEvent<HTMLDivElement>) => {
    middleClickOffset = e.clientY - buttonTopCoord;
    document.body.addEventListener('mousemove', scrollMoveHandler);
}

const handleZoomToolBottomButtonOnMouseDown = (e:React.MouseEvent<HTMLDivElement>) => {
    lastClickMoveOffset = e.clientY;
    tempButtonHeight = getMainButtonHeight(zoomLevel);
    document.body.addEventListener('mousemove', bottomZoomMoveHandler);
}

const handleZoomToolTopButtonOnMouseDown = (e:React.MouseEvent<HTMLDivElement>) => {
    lastClickMoveOffset = e.clientY;
    tempButtonHeight = getMainButtonHeight(zoomLevel);
    document.body.addEventListener('mousemove', topZoomMoveHandler);
}

document.body.addEventListener('mouseup', () => {
    document.body.removeEventListener('mousemove', scrollMoveHandler);
    document.body.removeEventListener('mousemove', bottomZoomMoveHandler);
    document.body.removeEventListener('mousemove', topZoomMoveHandler);
});

document.body.addEventListener('wheel', function(e:WheelEvent) {
    const offset = e.deltaY * currentScrollingAvailableSize / componentProps.pageTotalHeight;

    if (buttonTopCoordState + offset >= -5 && buttonTopCoordState + offset <= currentScrollingAvailableSize + 5) {
        buttonTopCoordState += offset;
        setButtonTopCoord(buttonTopCoordState);
        const currentPercentage = buttonTopCoordState / currentScrollingAvailableSize;
        componentProps.setCurrentScrollPosition((componentProps.pageTotalHeight - window.innerHeight) * currentPercentage);
    }
})

function ZoomTool(props:zoomToolProps) {
    
    if (!initialZoomLevel)
        initialZoomLevel = props.pageTotalHeight / window.innerHeight;
    [zoomLevel, setZoomLevel] = useState(initialZoomLevel);
    currentScrollingAvailableSize = settings.zoomToolInitialSize.height - getMainButtonHeight(zoomLevel) - settings.stdPadding * 2;
    
    useLayoutEffect(function() {
        buttonTopCoordState = props.currentScrollPosition * currentScrollingAvailableSize / props.pageTotalHeight;
    }, []);
    
    [buttonTopCoord, setButtonTopCoord] = useState(props.currentScrollPosition * currentScrollingAvailableSize / props.pageTotalHeight);
    componentProps = props;

    const zoomToolStyle:zoomToolStyle = {
        top : settings.zoomToolInitialSize.top + 'px',
        width : settings.zoomToolInitialSize.width + "px",
        height : settings.zoomToolInitialSize.height + "px",
        right : settings.zoomToolInitialSize.right + 'px'
    };

    let zoomToolMainButtonStyle = {
        top : buttonTopCoordState + "px",
        height : getMainButtonHeight(zoomLevel) + "px",
        width : settings.zoomButtonInitialSize.width + 'px',
        padding : settings.stdPadding + 'px'
    };

    const zoomToolInnerButtonStyle = {
        width : settings.zoomInnerButtonInitialSize.width + "px",
        height : settings.zoomInnerButtonInitialSize.height + "px"
    }

    const zoomToolInnerMiddleButtonStyle = {
        top : getMiddleButtonMarginTop(zoomLevel) + 'px',
        width : settings.zoomInnerButtonInitialSize.width + "px",
        height : settings.zoomInnerButtonInitialSize.height + "px"
    }

    const zoomToolInnerBottomButtonStyle = {
        top : getBottomButtonMarginTop(zoomLevel) + 'px',
        width : settings.zoomInnerButtonInitialSize.width + "px",
        height : settings.zoomInnerButtonInitialSize.height + "px"
    }

    return (
        <>
            <div className="zoom-tool" style={zoomToolStyle}>
                <div className="zoom-tool-button" style={zoomToolMainButtonStyle}>
                    <div className="zoom-tool-inner-button zoom-tool-top-button" style={zoomToolInnerButtonStyle} onMouseDown={handleZoomToolTopButtonOnMouseDown}>🔎</div>
                    <div className="zoom-tool-inner-button zoom-tool-middle-button" style={zoomToolInnerMiddleButtonStyle} onMouseDown={handleZoomToolMiddleButtonOnMouseDown}>⇅</div>
                    <div className="zoom-tool-inner-button zoom-tool-bottom-button" style={zoomToolInnerBottomButtonStyle} onMouseDown={handleZoomToolBottomButtonOnMouseDown}>🔎</div>
                </div>
            </div>
        </>
    )
}

function getMainButtonHeight (zoomLevel:number) {
    return settings.zoomButtonInitialSize.height / zoomLevel;
}

function getMiddleButtonMarginTop (zoomLevel:number) {
    return (getMainButtonHeight(zoomLevel) - settings.stdPadding * 2) / 2 - settings.zoomInnerButtonInitialSize.height * .5;
}

function getBottomButtonMarginTop (zoomLevel:number) {
    return (getMainButtonHeight(zoomLevel) - settings.stdPadding * 2) - settings.zoomInnerButtonInitialSize.height;
}





export default ZoomTool;