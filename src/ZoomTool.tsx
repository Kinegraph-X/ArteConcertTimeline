import './types.ts';
import { useState, useEffect } from 'react';
import settings from './constants/settings.ts';

let middleClickOffset:number,
    initialBottomClickPos:number,
    bottomClickOffset:number;
let scrollMoveHandler:{(this: HTMLElement, ev: MouseEvent) : any};
let bottomZoomMoveHandler:{(this: HTMLElement, ev: MouseEvent) : any};

function ZoomTool(props:zoomToolProps) {

    const [zoomLevel, setZoomLevel] = useState(props.pageTotalHeight / window.innerHeight);
    const [buttonTopCoord, setButtonTopCoord] = useState(0);

    const currentScrollingAvailableSize = settings.zoomToolInitialSize.height - getMainButtonHeight(zoomLevel) - settings.stdPadding * 2;

    useEffect(() => {
        scrollMoveHandler = (moveEvent:MouseEvent) => {
            const topCoord = moveEvent.clientY - middleClickOffset;
            if (topCoord >= 0 && topCoord <= currentScrollingAvailableSize)
                setButtonTopCoord(topCoord);
        }

        bottomZoomMoveHandler = (moveEvent:MouseEvent) => {
            let newButtonHeight:number;
            const moveOffset = moveEvent.clientY - initialBottomClickPos;
            if (buttonTopCoord >= 0)
                newButtonHeight = (getMainButtonHeight(zoomLevel)  + moveOffset * 2);
            else
                newButtonHeight = (getMainButtonHeight(zoomLevel)  + moveOffset);
            const newZoomLevel = settings.zoomButtonInitialSize.height / newButtonHeight;
            if (newZoomLevel >= 1 && newButtonHeight > settings.zoomInnerButtonInitialSize.height * 3) {
                if (buttonTopCoord >= 0)
                    setButtonTopCoord(buttonTopCoord - moveOffset)
                setZoomLevel(newZoomLevel);
            }
        }

        document.body.addEventListener('mouseup', () => {
            document.body.removeEventListener('mousemove', scrollMoveHandler);
            document.body.removeEventListener('mousemove', bottomZoomMoveHandler);
        });
    }, []);

    useEffect(() => {
        const currentPercentage = buttonTopCoord / currentScrollingAvailableSize;
        if (buttonTopCoord >= 0 && buttonTopCoord <= currentScrollingAvailableSize) {
            props.setCurrentScrollPosition(props.pageTotalHeight * currentPercentage);
        }
    }, [buttonTopCoord]);
    
    const handleZoomToolMiddleButtonOnMouseDown = (e:React.MouseEvent<HTMLDivElement>) => {
        middleClickOffset = e.clientY - buttonTopCoord;
        document.body.addEventListener('mousemove', scrollMoveHandler);
    }

    const handleZoomToolBottomButtonOnMouseDown = (e:React.MouseEvent<HTMLDivElement>) => {
        bottomClickOffset = e.clientY - getMainButtonHeight(zoomLevel) - buttonTopCoord;
        initialBottomClickPos = e.clientY;
        document.body.addEventListener('mousemove', bottomZoomMoveHandler);
    }


    const zoomToolStyle:zoomToolStyle = {
        top : settings.zoomToolInitialSize.top + 'px',
        width : settings.zoomToolInitialSize.width + "px",
        height : settings.zoomToolInitialSize.height + "px",
        right : settings.zoomToolInitialSize.right + 'px'
    };

    let zoomToolMainButtonStyle = {
        top : buttonTopCoord + "px",
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
                    <div className="zoom-tool-inner-button zoom-tool-top-button" style={zoomToolInnerButtonStyle}></div>
                    <div className="zoom-tool-inner-button zoom-tool-middle-button" style={zoomToolInnerMiddleButtonStyle} onMouseDown={handleZoomToolMiddleButtonOnMouseDown}></div>
                    <div className="zoom-tool-inner-button zoom-tool-bottom-button" style={zoomToolInnerBottomButtonStyle} onMouseDown={handleZoomToolBottomButtonOnMouseDown}></div>
                </div>
            </div>
        </>
    )
}

function getMainButtonHeight (zoomLevel:number) {
    return settings.zoomButtonInitialSize.height / zoomLevel;
}

function getMainButtonMarginTop (zoomLevel:number) {
    return 0 //(settings.zoomToolInitialSize.height - getMainButtonHeight(zoomLevel)) / 2;
}

function getMiddleButtonMarginTop (zoomLevel:number) {
    return (getMainButtonHeight(zoomLevel) - settings.stdPadding * 2) / 2 - settings.zoomInnerButtonInitialSize.height * .5;
}

function getBottomButtonMarginTop (zoomLevel:number) {
    return (getMainButtonHeight(zoomLevel) - settings.stdPadding * 2) - settings.zoomInnerButtonInitialSize.height;
}





export default ZoomTool;