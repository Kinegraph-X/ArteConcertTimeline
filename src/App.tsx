import './types.ts';
import { useEffect, useState, Fragment } from 'react';
import settings from './constants/settings.ts';
import './App.css';
import ZoomTool from './ZoomTool - classical.tsx';
import StreamCard from './StreamCard.tsx';
import RoundCheckbox from './RoundCheckbox.tsx';

const hoursInADay = 24;
const pageWidthPreCalc = settings.gutterWidth + settings.zoomToolInitialSize.width + settings.zoomToolInitialSize.right + settings.stdPadding * 2 + settings.stdMargin * 2;

/*
* Mockup of static fake arrays
*/
const lineDescriptors:lineDescriptor[] = [];
(function initLines() {
  for (let i = 0, l = settings.days * hoursInADay; i < l; i++) {
    lineDescriptors.push({initialHeight : settings.originalLineHeight})
  }
})()

const subDivisionArray:number[] = [];
for (let i = 0, l = 6; i < l; i++) {
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
      fetch('/_arteconcert_dom_crawler/dom_crawler.php').then((response) => { // http://localhost:80
        response.json().then((data:streamData[]) => {
          setStreamsData(data);
        });
      });
    }
    setInterval(fetchFunction, 30 * 1000);
    fetchFunction();
    addEventListener("resize", (event) => {
      setColumnWidth((window.innerWidth - pageWidthPreCalc) / currentColumnCount);
    });
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
  let currentDate = new Date();
  // Handle the case where we are just after midnight, and allow seeing the previous day to be able to monitor streams crossing midnight
  if (currentDate.getHours() < 5)
    currentDate = new Date(`${currentDate.getMonth() + 1}-${currentDate.getDate() - 1}-${currentDate.getFullYear()}`);

  const todayMidnight = new Date(`${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getFullYear()}`).getTime();
  const displayedHour = currentDate.getHours().toString().padStart(2, '0') + ':' + currentDate.getMinutes().toString().padStart(2, '0');

  const initialScroll = Math.max((currentDate.getTime() - todayMidnight) * settings.originalLineHeight / 3600000 - window.innerHeight / 2, 0);
  const [currentScrollPosition, setCurrentScrollPosition] = useState(initialScroll);
  const pageTotalHeight = lineDescriptors.length * lineHeight;
  
  /*
   * Mockup of dynamic fake arrays
  */
  const columnArray:number[] = [];
  for (let i = 0, l = currentColumnCount; i < l; i++) {
    columnArray.push(i);
  }
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  return (
    <Fragment>
      <header id="site-header" style={{height : settings.headerHeight + 'px'}}>
        <div className="title"></div>
        Visible Channels : 
        {buttonArray.map(function(idx) {
          return <RoundCheckbox 
              label={idx}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
              currentColumnCount={currentColumnCount}
              setCurrentColumnCount={setCurrentColumnCount}
            />;
        })}
        <div className="hint">
          <div><span className="yellow">Yellow</span> programs are VOD's, the date from the API is randomized for demo purposes</div>
          <div className="second"><span className="green">Green</span> programs are livestreams, they're placed at the time they'll start</div>
        </div>
      </header>

      <section id="grid-element" style={{marginTop: (- currentScrollPosition + settings.headerHeight + settings.stdMargin).toString() + "px"}}>
        {lineDescriptors.map(function(lineDescriptor, key) {
          const currentHour = getHourOfDay(key);
            return (
              <div key={key} className="line hour" style={{height : lineHeight + 'px'}} aria-hidden>
                
                <div className="hour-text">{currentHour.toString().padStart(2, '0')}:00</div>
                <div className="day-text" style={{opacity : currentHour === 0 ? '1' : '0'}}>{getCurrentDay(key, todayMidnight)}</div>
                <div className="columns" style={{marginLeft : settings.gutterWidth + settings.stdMargin}}>
                  {columnArray.map(function(idx) {
                    return (
                      <div className="column" style={{width : columnWidth + 'px', height : lineHeight + 'px'}}>
                        {subDivisionArray.map(function(subDivIdx) {
                          const backgroundColor = (key > (currentHours - 1) && subDivIdx + 1 > currentMinutes / 10)
                            || key > (currentDate.getHours())
                              ? settings.upcomingGridColor
                              : 'transparent';
                          return (
                            <div className="sub-division" style={{
                              width : (columnWidth - 2) + 'px',
                              height : lineHeight / 6 + 'px',
                              backgroundColor : backgroundColor
                            }}></div>
                          )
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        })}
        <section className="displayed-hour" style={{top : (((currentDate.getTime() - todayMidnight) / 1000) * lineHeight / 3600 - settings.displayedHourHeight / 2) + 'px'}}>
          {displayedHour}
        </section>
        <div id="triangle" style={{top : (((currentDate.getTime() - todayMidnight) / 1000) * lineHeight / 3600 - settings.triangleHeight / 2) + 'px'}}></div>
      </section>

      <section id='streams-overlay' style={{top : (settings.headerHeight + settings.stdMargin) + 'px', marginTop: (- currentScrollPosition).toString() + "px"}}>
        {streamsData.map(function(streamData) {
          if (activeColumns[streamData.stream_channel])
            return <StreamCard
              key={streamData.stream_channel + '-' + streamData.date}
              todayMidnight={todayMidnight}
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

function getCurrentDay(idx:number, todayMidnight:number) {
  const daysElapsed = Math.floor(idx / hoursInADay);
  return (new Date(todayMidnight + daysElapsed * 3600 * 24 * 1000)).toLocaleDateString();
}

export default App