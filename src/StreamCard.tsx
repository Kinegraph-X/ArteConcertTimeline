import './types.ts';
import { useState} from 'react';
import settings from './constants/settings.ts';

const StreamCard = function(props:streamCardProps) {
    
    // console.log(props.livestreamDesc.date - props.todayMidnight / 1000,  props.lineHeight / 3600);
    const streamCardStyle = {
        top : (props.livestreamDesc.date !== null 
            ? ((props.livestreamDesc.date - props.todayMidnight / 1000) * props.lineHeight / 3600) 
            : ((props.todayMidnight + 3600000 * 10) / 1000)) + 'px',
        left : (
                settings.gutterWidth
                + settings.stdMargin
                + (props.livestreamDesc.stream_channel - props.activeColumns.filter((isActive, key) => key < props.livestreamDesc.stream_channel && !isActive).length) * props.columnWidth
            )
            + 'px',
        width : props.columnWidth + 'px',
        height : props.livestreamDesc.duration < 20  * 60 || props.livestreamDesc.duration > 240  * 60
            ? props.lineHeight * settings.stdCardDuration / 3600
            : props.lineHeight * props.livestreamDesc.duration / 3600
    }
    // console.log(
    //     props.livestreamDesc.title,
    //     props.livestreamDesc.HR_date,
    //     props.livestreamDesc.date,
    //     props.todayMidnight / 1000,
    //     (props.livestreamDesc.date - props.todayMidnight / 1000) / 3600,
    //     streamCardStyle.top);

    return (
        <div className='stream-card' style={streamCardStyle}>
            <a href={props.livestreamDesc.public_page}>
                <div className={'stream-flag' + (props.livestreamDesc.is_fictive ? ' is-fictive' : '')}></div>
                <p className="stream-title">{props.livestreamDesc.title}</p>
                <p className="stream-subtitle">{props.livestreamDesc.subtitle}</p>
                <p className="stream-date">{props.livestreamDesc.HR_date}</p>
                <img src={props.livestreamDesc.thumbnail} width={props.columnWidth} height={props.columnWidth * settings.cardThumbnailImgHeight / settings.cardThumbnailImgwidth}/>
            </a>    
        </div>
    )
}

export default StreamCard;