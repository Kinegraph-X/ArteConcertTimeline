import { useState} from 'react';

class ZoomToolClass {

    buttonTopCoordState = 0;
    componentProps;
    buttonTopCoord;
    setButtonTopCoord;

    constructor() {
        document.body.addEventListener('mouseup', () => {
            document.body.removeEventListener('mousemove', this.scrollMoveHandler);
        });
    }

    scrollMoveHandler(moveEvent) {
        // do something
        // give a new value to your "this.buttonTopCoordState"
        // and call this.setButtonTopCoord() to re-render
    }

    handleZoomToolOnMouseDown(e) {
        document.body.addEventListener('mousemove', scrollMoveHandler);
    }

    ZoomTool(props) {   /* <- Ceci est le composant react */
        [this.buttonTopCoord, this.setButtonTopCoord] = useState(buttonTopCoordState);
        this.componentProps = props;

        return (
            <>
                <div onMouseDown={handleZoomToolOnMouseDown}></div>
            </>
        )
    }
}

const instance = new ZoomToolClass();

export default instance.ZoomTool;