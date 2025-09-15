import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const diagramRef = useRef(null);
  const [urgencyData, setUrgencyData] = useState({});

  // Function to get entity number from HTML file
  const getEntityNumber = async (entityKey) => {
    try {
      const response = await fetch(`/entities/${entityKey}.html`);
      if (!response.ok) {
        console.error(`Failed to fetch ${entityKey}.html: ${response.status}`);
        return '0';
      }
      
      const html = await response.text();
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Look for all label cells and find the one with "Entity No."
      const labelCells = tempDiv.querySelectorAll('td.label');
      for (const labelCell of labelCells) {
        if (labelCell.textContent.trim() === 'Entity No.') {
          // Find the corresponding value cell in the same row
          const row = labelCell.parentElement;
          const valueCell = row.querySelector('td.value');
          if (valueCell) {
            // Look for the span inside the value cell
            const span = valueCell.querySelector('span');
            if (span) {
              const entityNumber = span.textContent.trim();
              console.log(`${entityKey} entity number: ${entityNumber}`);
              return entityNumber;
            }
          }
        }
      }
      
      console.log(`${entityKey} no entity number found, defaulting to 0`);
      return '0';
    } catch (error) {
      console.error(`Error getting entity number for ${entityKey}:`, error);
      return '0';
    }
  };

  // Function to check urgency status of an entity
  const checkEntityUrgency = async (entityKey) => {
    try {
      const response = await fetch(`/entities/${entityKey}.html`);
      if (!response.ok) {
        console.error(`Failed to fetch ${entityKey}.html: ${response.status}`);
        return 'default';
      }
      
      const html = await response.text();
      
      // Create a temporary div to parse the HTML (more reliable than DOMParser)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      const deadlineDates = tempDiv.querySelectorAll('.deadline-date');
      console.log(`Found ${deadlineDates.length} deadline dates for ${entityKey}`);
      
      let hasRed = false;
      let hasYellow = false;
      const today = new Date();
      
      deadlineDates.forEach((dateElement, index) => {
        const dateString = dateElement.getAttribute('data-date');
        if (dateString) {
          const deadlineDate = new Date(dateString);
          const timeDiff = deadlineDate.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          console.log(`${entityKey} deadline ${index + 1}: ${dateString}, days diff: ${daysDiff}`);
          
          if (daysDiff < 0) {
            hasRed = true;
            console.log(`${entityKey} has RED deadline: ${dateString}`);
          } else if (daysDiff <= 30) {
            hasYellow = true;
            console.log(`${entityKey} has YELLOW deadline: ${dateString}`);
          }
        }
      });
      
      // Return urgency level: 'red', 'yellow', or 'default'
      if (hasRed) {
        console.log(`${entityKey} returning RED urgency`);
        return 'red';
      }
      if (hasYellow) {
        console.log(`${entityKey} returning YELLOW urgency`);
        return 'yellow';
      }
      console.log(`${entityKey} returning DEFAULT urgency`);
      return 'default';
    } catch (error) {
      console.error(`Error checking urgency for ${entityKey}:`, error);
      return 'default';
    }
  };

  // Function to get color based on urgency
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'red': return '#f8d7da';
      case 'yellow': return '#fff3cd';
      default: return 'lightblue';
    }
  };

  // Function to update urgency colors and entity numbers for all entities
  const updateUrgencyColors = async () => {
    if (!diagramRef.current) {
      console.log('Diagram not ready yet');
      return;
    }
    
    console.log('Starting urgency color and entity number update...');
    const urgencyUpdates = {};
    const entityNumberUpdates = {};
    
    // Test with just RealNetworks first
    console.log('Testing RealNetworks urgency specifically...');
    const realNetworksUrgency = await checkEntityUrgency('RealNetworks');
    console.log('RealNetworks urgency result:', realNetworksUrgency);
    
    const model = diagramRef.current.model;
    
    for (const node of model.nodeDataArray) {
      console.log(`Checking urgency and entity number for ${node.key}...`);
      const urgency = await checkEntityUrgency(node.key);
      const entityNumber = await getEntityNumber(node.key);
      urgencyUpdates[node.key] = urgency;
      entityNumberUpdates[node.key] = entityNumber;
      console.log(`${node.key} urgency: ${urgency}, entity number: ${entityNumber}`);
    }
    
    console.log('All urgency updates:', urgencyUpdates);
    console.log('All entity number updates:', entityNumberUpdates);
    
    // Update the model with urgency data and entity numbers
    model.nodeDataArray.forEach(node => {
      node.urgency = urgencyUpdates[node.key] || 'default';
      node.entityNumber = entityNumberUpdates[node.key] || '0';
      console.log(`Updated ${node.key} with urgency: ${node.urgency}, entity number: ${node.entityNumber}`);
    });
    
    // Force diagram update
    diagramRef.current.model = model;
    console.log('Diagram model updated with urgency data and entity numbers');
    
    // Force a redraw
    diagramRef.current.updateAllTargetBindings();
    console.log('Diagram redrawn with urgency colors and entity numbers');
  };

  useEffect(() => {
    const loadGoJS = async () => {
      const go = await import('gojs');
      const $ = go.GraphObject.make;

      const diagram = $(go.Diagram, 'chartDiv', {
        initialAutoScale: go.Diagram.Uniform,
        layout: $(go.TreeLayout, {
          angle: 0,
          layerSpacing: 50,
          nodeSpacing: 30,
          arrangement: go.TreeLayout.ArrangementVertical
        }),
        'undoManager.isEnabled': true
      });

      diagram.nodeTemplate =
        $(go.Node, 'Auto',
          $(go.Shape, 'RoundedRectangle', { 
            fill: 'lightblue', 
            strokeWidth: 0 
          }, new go.Binding('fill', 'urgency', getUrgencyColor)),
          $(go.Panel, 'Horizontal',
            { margin: 8 },
            $(go.TextBlock, { font: 'bold 11pt sans-serif', stroke: 'black' },
              new go.Binding('text', 'name')),
            $(go.Panel, 'Spot',
              { margin: new go.Margin(0, 0, 0, 8), width: 20, height: 20 },
              $(go.Shape, 'Circle', { 
                width: 20, 
                height: 20, 
                stroke: 'black', 
                strokeWidth: 1, 
                fill: 'transparent' 
              }),
              $(go.TextBlock, { 
                font: 'bold 9pt sans-serif', 
                stroke: 'black',
                textAlign: 'center'
              },
                new go.Binding('text', 'entityNumber')
              ),
              new go.Binding('visible', 'entityNumber', function(num) { return num !== undefined && num !== null; })
            )
          ),
          {
            click: function (e, obj) {
              const url = '/entities/' + obj.part.data.key + '.html';
              window.open(url, '_blank');
            }
          }
        );

      diagram.linkTemplate =
        $(go.Link,
          $(go.Shape),
          $(go.Shape, { toArrow: 'Standard' })
        );

      const model = new go.GraphLinksModel({
        nodeDataArray: [{'key': 'RobGlaser', 'name': 'Rob Glaser'}, {'key': 'GH', 'name': 'GH Sliver Inc. (S-Corp)'}, {'key': 'GreaterHeights', 'name': 'Greater Heights LLC'}, {'key': 'RealNetworks', 'name': 'RealNetworks LLC'}, {'key': 'RealNetworksInvestments', 'name': 'RealNetworks Investments LLC (DE)'}, {'key': 'GameHouseDE', 'name': 'GameHouse LLC (DE)'}, {'key': 'RealNetworksGlobal', 'name': 'RealNetworks Global LLC (DE)'}, {'key': 'RealNetworksUK', 'name': 'RealNetworks Ltd. (UK)'}, {'key': 'RealNetworksKorea', 'name': 'RealNetworks Korea Ltd.'}, {'key': 'RealNetworksCroatia', 'name': 'RealNetworks D.O.O (Croatia)'}, {'key': 'RealNetworksJapan', 'name': 'RealNetworks KK (Japan)'}, {'key': 'RealNetworksChina', 'name': 'Beijing RealNetworks Technology Co. Ltd. (China)'}, {'key': 'RNMusicCA', 'name': 'RealNetworks Digital Music California LLC (CA)'}, {'key': 'ListenCom', 'name': 'Listen.com LLC (CA)'}, {'key': 'TMAcquisition', 'name': 'TM Acquisition LLC'}, {'key': 'GHSpain', 'name': 'GameHouse Spain SL'}, {'key': 'RNIntHoldingsCV', 'name': 'RealNetworks Int. Holdings CV'}, {'key': 'RNIntHoldingsBV', 'name': 'RN Int Holdings BV'}, {'key': 'MuzicalUK', 'name': 'Muzical Ltd (UK)'}, {'key': 'DigitalHoldingKorea', 'name': 'Digital Holding Asia Pacific Co. Ltd (Korea)'}, {'key': 'GHIndia', 'name': 'RN India Pvt Ltd'}, {'key': 'GHIndonesia', 'name': 'RealNetworks Indonesia'}, {'key': 'GHPH', 'name': 'RealNetworks Philippines'}, {'key': 'GH_Europe', 'name': 'GameHouse Europe B.V'}, {'key': 'RNGMBH', 'name': 'RealNetworks GMBH (Austria)'}, {'key': 'RNPortugal', 'name': 'RN Portugal'}, {'key': 'RN_Acq', 'name': 'RN Acquisitions LLC (WA)'}, {'key': 'RNBrazil', 'name': 'RealNetworks Brazil LTDA'}, {'key': 'AratviaLATAM', 'name': 'Aratavia Latin America LTDA'}, {'key': 'RNGames', 'name': 'RN Games LLC (DE)'}, {'key': 'SAFRLLC', 'name': 'SAFR LLC (WA)'}, {'key': 'SAFRWA2', 'name': 'SAFR WA LLC'}, {'key': 'SAFROR', 'name': 'SAFR OR LLC'}, {'key': 'SAFRNV', 'name': 'SAFR NV LLC'}],
                  linkDataArray: [{'from': 'RobGlaser', 'to': 'GreaterHeights'}, {'from': 'GH', 'to': 'GreaterHeights'}, {'from': 'GreaterHeights', 'to': 'RealNetworks'}, {'from': 'RealNetworks', 'to': 'RealNetworksInvestments'}, {'from': 'RealNetworks', 'to': 'GameHouseDE'}, {'from': 'RealNetworks', 'to': 'RealNetworksGlobal'}, {'from': 'RealNetworks', 'to': 'RealNetworksUK'}, {'from': 'RealNetworks', 'to': 'RealNetworksKorea'}, {'from': 'RealNetworks', 'to': 'RealNetworksCroatia'}, {'from': 'RealNetworks', 'to': 'RealNetworksJapan'}, {'from': 'RealNetworks', 'to': 'RealNetworksChina'}, {'from': 'RealNetworks', 'to': 'RNMusicCA'}, {'from': 'RNMusicCA', 'to': 'ListenCom'}, {'from': 'RealNetworks', 'to': 'TMAcquisition'}, {'from': 'TMAcquisition', 'to': 'GHSpain'}, {'from': 'RealNetworks', 'to': 'RNIntHoldingsCV'}, {'from': 'RNIntHoldingsCV', 'to': 'RNIntHoldingsBV'}, {'from': 'RNIntHoldingsBV', 'to': 'MuzicalUK'}, {'from': 'RNIntHoldingsBV', 'to': 'DigitalHoldingKorea'}, {'from': 'DigitalHoldingKorea', 'to': 'GHIndia'}, {'from': 'DigitalHoldingKorea', 'to': 'GHIndonesia'}, {'from': 'DigitalHoldingKorea', 'to': 'GHPH'}, {'from': 'RNIntHoldingsBV', 'to': 'GH_Europe'}, {'from': 'RNIntHoldingsBV', 'to': 'RNGMBH'}, {'from': 'RNGMBH', 'to': 'RNPortugal'}, {'from': 'RealNetworks', 'to': 'RN_Acq'}, {'from': 'RN_Acq', 'to': 'RNBrazil'}, {'from': 'RN_Acq', 'to': 'AratviaLATAM'}, {'from': 'RealNetworks', 'to': 'RNGames'}, {'from': 'RealNetworks', 'to': 'SAFRLLC'}, {'from': 'SAFRLLC', 'to': 'SAFRWA2'}, {'from': 'SAFRLLC', 'to': 'SAFROR'}, {'from': 'SAFRLLC', 'to': 'SAFRNV'}]
      });

      diagram.model = model;
      diagramRef.current = diagram;

      // Update urgency colors and entity numbers after diagram is loaded with a delay
      setTimeout(() => {
        console.log('Delayed urgency and entity number check starting...');
        updateUrgencyColors();
      }, 1000);

      // Trigger search if query param exists
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search');
      if (q) {
        const query = q.toLowerCase();
        const match = model.nodeDataArray.find(n => n.name.toLowerCase().includes(query));
        if (match) {
          const node = diagram.findNodeForData(match);
          diagram.select(node);
          diagram.centerRect(node.actualBounds);
        }
      }
    };
    loadGoJS();
  }, []);

  return (
    <>
      <Head>
        <title>Corporate Structure - RealNetworks</title>
      </Head>
      <main>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 20px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <h1 style={{ textAlign: 'center', margin: 0, flex: '1', minWidth: '300px' }}>RealNetworks Corporate Structure</h1>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontWeight: 'bold' }}>Urgency Legend:</div>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: '#f8d7da', 
                  borderRadius: '4px',
                  border: '1px solid #f5c6cb'
                }}></div>
                <span>Red: Overdue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: '#fff3cd', 
                  borderRadius: '4px',
                  border: '1px solid #ffeaa7'
                }}></div>
                <span>Yellow: Due within 30 days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: 'lightblue', 
                  borderRadius: '4px'
                }}></div>
                <span>Blue: Normal</span>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log('Manual entity number update triggered');
                if (diagramRef.current) {
                  updateUrgencyColors();
                }
              }}
              style={{
                marginLeft: '15px',
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Refresh Numbers
            </button>
          </div>
        </div>
        <div id="chartDiv" style={{ width: '100vw', height: '90vh', backgroundColor: '#f8f8f8' }}></div>
      </main>
    </>
  );
}
