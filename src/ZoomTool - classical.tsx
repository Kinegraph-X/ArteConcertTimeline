import './types.ts';
import { useState, useLayoutEffect, useEffect } from 'react';
import settings from './constants/settings.ts';

// const debounce = <F extends (args: any) => any> (func:F, delay:number) => {
//     let debounceTimer:NodeJS.Timeout;
//     return function(...args:Parameters<F>) {
//         // @ts-ignore
//       const context = this;
//       clearTimeout(debounceTimer);
//       debounceTimer = setTimeout(() => func.apply(context, args), delay);
//     } as (...args: Parameters<F>) => ReturnType<F>;
//   };

/**
 * ⚠️ Note for future maintainers:
 *
 * This component uses module-scope mutable variables to hold derived values
 * (instead of React state or refs). On every render, these variables are
 * reassigned from the current props/state, so they never go stale and never
 * cause side effects between renders.
 *
 * Why is this okay here?
 * - Because the values are always overwritten on each render, they stay
 *   consistent with the latest props/state during that render pass.
 * - Even with multiple instances, React renders components one at a time, so
 *   no two instances "race" while traversing the tree.
 * - All functions consuming these values are pure math (no hidden side effects).
 * - React’s render cycle isn’t bypassed — nothing external depends on these
 *   variables outside the component’s render context.
 *
 * Why is this considered “non-idiomatic” in React?
 * - React cannot "see" or track these globals, so the data flow looks unusual
 *   compared to conventional hooks like useState/useRef/useMemo.
 * - Other React developers might expect idiomatic patterns and be surprised.
 *
 * If this app were to grow (multiple instances, reuse by others), a more
 * idiomatic approach would be:
 * - Use `useRef` to store mutable non-visual state that persists across renders.
 * - Use `useMemo` for derived values from props.
 * - Or centralize the zoom state in context or a store if multiple components
 *   needed to coordinate.
 *
 * In short: this is a pragmatic, lean hack that works fine for this specific
 * case. If the scope expands, it should be refactored toward idiomatic React
 * patterns for clarity and maintainability.
 */


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
    if ((buttonTopCoordState >= 0 || moveOffset < 0) && buttonTopCoordState + tempButtonHeight <= settings.zoomToolInitialSize.height - settings.stdPadding * 2)
        tempButtonHeight += moveOffset * 2;
    else
        tempButtonHeight += moveOffset;
    const newZoomLevel = settings.zoomButtonInitialSize.height / tempButtonHeight;
    if (newZoomLevel >= 1 && tempButtonHeight > settings.zoomInnerButtonInitialSize.height * 3) {
        if (buttonTopCoordState >= 0 || moveOffset < 0) {
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
    if ((buttonTopCoordState >= 0 || moveOffset > 0) && buttonTopCoordState + tempButtonHeight <= settings.zoomToolInitialSize.height - settings.stdPadding * 2)
        tempButtonHeight += -moveOffset * 2;
    else
        tempButtonHeight += -moveOffset;
    const newZoomLevel = settings.zoomButtonInitialSize.height / tempButtonHeight;
    if (newZoomLevel >= 1 && tempButtonHeight > settings.zoomInnerButtonInitialSize.height * 3) {
        if (buttonTopCoordState >= 0 || moveOffset > 0) {
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
};

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