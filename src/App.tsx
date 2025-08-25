import './types.ts';
import { useEffect, useState, useMemo, Fragment } from 'react';
import settings from './constants/settings.ts';
import './App.css';
import ZoomTool from './ZoomTool - classical.tsx';
import StreamCard from './StreamCard.tsx';
import RoundCheckbox from './RoundCheckbox.tsx';

const hoursInADay = 24;
const pageWidthPreCalc = settings.gutterWidth + settings.zoomToolInitialSize.width + settings.zoomToolInitialSize.right + settings.stdPadding * 2 + settings.stdMargin * 2;

/*
* Static arrays for the grid
*/
const lineDescriptors:lineDescriptor[] = [];
(function initLines() {
  for (let i = 0, l = settings.days * hoursInADay; i < l; i++) {
    lineDescriptors.push({initialHeight : settings.originalLineHeight})
  }
})()

const subDivisionArray:number[] = [];
for (let i = 0, l = settings.hourSubdivisions; i < l; i++) {
  subDivisionArray.push(i);
}

const buttonArray:number[] = [];
for (let i = 0, l = settings.initialColumnCount; i < l; i++) {
  buttonArray.push(i);
}

function App() {
  /*
   * Effects & States
  */
  useEffect(() => {
    const fetchFunction = function() {
      let backendUrl = '';
      if (window.location.href.match(/localhost/))
        backendUrl = 'http://localhost:80';
      fetch(backendUrl + '/_arteconcert_dom_crawler/dom_crawler.php').then((response) => {
        if (!response.ok) {
          response.text().then((txt) => {
            console.error('The server responded : ' + txt);
          });
        	return;
        }
        response.json().then((data:streamData[]) => {
          setStreamsData(data);
        });
      });
    }
    const appRefreshInterval = setInterval(fetchFunction, 10 * 1000);
    fetchFunction();
    addEventListener("resize", (event) => {
      setColumnWidth((window.innerWidth - pageWidthPreCalc) / currentColumnCount);
    });
    return () => clearInterval(appRefreshInterval);
  }, []);

  const [streamsData, setStreamsData] = useState([] as streamData[]);
  const [currentColumnCount, setCurrentColumnCount] = useState(settings.initialColumnCount);
  const [activeColumns, setActiveColumns] = useState([true, true, true, true])
  const [lineHeight, setLineHeight] = useState(settings.originalLineHeight);
  const [columnWidth, setColumnWidth] = useState((window.innerWidth - pageWidthPreCalc) / currentColumnCount);

  useEffect(function() {
      setColumnWidth((window.innerWidth - pageWidthPreCalc) / currentColumnCount);
  }, [currentColumnCount]);
  useEffect(function() {
    setCurrentColumnCount(activeColumns.filter((isActive) => isActive === true).length);
  }, [activeColumns]);

  /*
   * define initial values : dates and scroll
  */
  const currentDate = new Date();
  const startDate = new Date(currentDate.getTime());
  startDate.setHours(currentDate.getHours() - settings.previousVisibleHours);
  startDate.setMinutes(0, 0, 0);
    
  const displayedHour = currentDate.getHours().toString().padStart(2, '0') + ':' + currentDate.getMinutes().toString().padStart(2, '0');
	
  const initialScroll = (currentDate.getTime() - startDate.getTime()) * settings.originalLineHeight / 3600000 - window.innerHeight / 2;
  const [currentScrollPosition, setCurrentScrollPosition] = useState(initialScroll);
  const pageTotalHeight = lineDescriptors.length * lineHeight;
  
  /*
   * Some preparation for the grid
  */
  const columnArray = useMemo(
    () => Array.from({ length: currentColumnCount }, (_, i) => i),
    [currentColumnCount]
  );
  
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  return (
    <Fragment>
      <header id="site-header" style={{height : settings.headerHeight + 'px'}}>
        <div className="title"></div>
        <div className="column-selectors">
          <span>Visible Channels&nbsp;: </span>
          {buttonArray.map(function(idx) {
            return <RoundCheckbox 
                key = {idx}
                label={idx}
                activeColumns={activeColumns}
                setActiveColumns={setActiveColumns}
                currentColumnCount={currentColumnCount}
                setCurrentColumnCount={setCurrentColumnCount}
              />;
          })}
        </div>
        <div className="hint">
          <div><span className="yellow">Yellow</span> programs are VOD's, the date from the API is randomized for demo purposes</div>
          <div className="second"><span className="green">Green</span> programs are livestreams, they're placed at the time they'll start</div>
        </div>
      </header>

      <section id="grid-element" style={{
            height : pageTotalHeight + 'px',
            marginTop: (- currentScrollPosition + settings.headerHeight + settings.stdMargin).toString() + "px"
          }}>
        {lineDescriptors.map(function(lineDescriptor, key) {
          const elapsedHours = key + currentDate.getHours() - settings.previousVisibleHours;
          const currentHour = getHourOfDay(elapsedHours + hoursInADay);   // Avoid negative values when crossing midnight
          
          return (
            <div key={key} 
                className={`line hour ${currentHour === 0 ? 'new-day' : ''}`}
                style={{top : (key * pageTotalHeight / 72) + 'px', height : lineHeight + 'px'}}
                aria-hidden
                >
              <div className="hour-text">{currentHour.toString().padStart(2, '0')}:00</div>
              <div className="day-text" >{getCurrentDay(elapsedHours, currentDate)}</div>
              <div className="columns" style={{marginLeft : settings.gutterWidth + settings.stdMargin}}>
                {columnArray.map(function(idx) {
                  return (
                    <div key={key.toString() + '-' + idx.toString()}
                        className="column"
                        style={{width : columnWidth + 'px', height : lineHeight + 'px'}}
                        >
                      {subDivisionArray.map(function(subDivIdx) {
                        return (
                          <div key={key.toString() + '-' + idx.toString() + '-' + subDivIdx.toString()} 
                            className={`sub-division ${
                              startDate.getTime() + key * 3600 * 1000 + (subDivIdx + 1) * (60 / settings.hourSubdivisions) * 60 * 1000 > currentDate.getTime()
                                ? 'after-now'
                                : ''
                              }`}
                            style={{
                              width : (columnWidth - 2) + 'px',
                              height : lineHeight / 6 + 'px',
                            }}>
                          </div>
                        )
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        })}
        <section className="displayed-hour" style={{top : (((currentDate.getTime() - startDate.getTime()) / 1000) * lineHeight / 3600 - settings.displayedHourHeight / 2) + 'px'}}>
          {displayedHour}
        </section>
        <div id="triangle" style={{top : (((currentDate.getTime() - startDate.getTime()) / 1000) * lineHeight / 3600 - settings.triangleHeight / 2) + 'px'}}></div>
      </section>

      <section id='streams-overlay' style={{top : (settings.headerHeight + settings.stdMargin) + 'px', marginTop: (- currentScrollPosition).toString() + "px"}}>
        {streamsData.map(function(streamData) {
          if (activeColumns[streamData.stream_channel] && streamData.date + streamData.duration > startDate.getTime() / 1000)
            return <StreamCard
              key={streamData.title + '-' + streamData.subtitle}
              todayMidnight={startDate.getTime()}
              livestreamDesc={streamData}
              columnWidth={columnWidth}
              lineHeight = {lineHeight}
              currentColumnCount={currentColumnCount}
              activeColumns={activeColumns}
            />
        })}
      </section>
      
      <ZoomTool
        pageTotalHeight={pageTotalHeight}
        currentScrollPosition={currentScrollPosition}
        setCurrentScrollPosition={setCurrentScrollPosition}
        setLineHeight={setLineHeight}
        style={{right : settings.zoomToolInitialSize.right}}
      />
    </Fragment>
  )
}

/*
* Utility functions
*/
function getHourOfDay(idx:number) {
    return idx % hoursInADay;
}

function getCurrentDay(elapsedHours:number, startDate:Date) {
  return (new Date(startDate.getTime() + elapsedHours * 3600 * 1000)).toLocaleDateString();
}

export default App