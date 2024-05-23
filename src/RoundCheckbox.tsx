import './types.ts';
import {useState, useEffect} from 'react';
import settings from './constants/settings.ts';

const RoundCheckbox = function(props:RoundCheckboxProps) {
    const [checked, setChecked] = useState(true);

    function setNewState(localState:boolean) {
        const newStateArray:boolean[] = [];
        // props.setCurrentColumnCount(localState === true ? props.currentColumnCount + 1 : props.currentColumnCount - 1);
        for (let i = 0, l = settings.initialColumnCount; i < l; i++) {
            if (i === props.label)
                newStateArray.push(localState);
            else
                newStateArray.push(props.activeColumns[i])
        }
        props.setActiveColumns(newStateArray);
    }

    function setCheckedHandler(e:React.MouseEvent<HTMLDivElement>) {
        if (checked) {
            setChecked(false);
            setNewState(false);
        }
        else {
            setChecked(true);
            setNewState(true);
        }
    }

    return (
        <>  
            <label className="for-checkbox">#{(props.label + 1).toString()}</label>
            <div className={'checkbox'} onMouseDown={setCheckedHandler}>
                <div className={'checkbox-button'} data-checked={checked}></div>
            </div>
        </>
    )
}

export default RoundCheckbox;