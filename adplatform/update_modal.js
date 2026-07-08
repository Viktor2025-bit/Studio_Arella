const fs = require('fs');

let c = fs.readFileSync('frontend/app/book/page.tsx', 'utf8');

// 1. Replace state
c = c.replace('const [selectedHour, setSelectedHour] = useState(8);', 'const [selectedHours, setSelectedHours] = useState<number[]>([8]);\n  const [draftLoops, setDraftLoops] = useState(1);');

// 2. autoSelectSlot is called when clicking a day cell
c = c.replace(
  'setSelectedHour(8);\n                            autoSelectSlot(d, 8);\n                            setShowSlotModal(true);',
  'setSelectedHours([8]);\n                            setDraftLoops(1);\n                            autoSelectSlot(d, 8);\n                            setShowSlotModal(true);'
);

// 3. autoSelectSlot definition: let's update it to also set draftLoops to 1
c = c.replace(
  'setDraft({ date, startMin: firstAvailMin, loops: 1 });',
  'setDraftLoops(1);\n      setDraft({ date, startMin: firstAvailMin, loops: 1 });'
);

// 4. Modal: Select Hour Grid
const hourGridOld = `                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
                      {hours.map((h) => (
                        <button key={h} onClick={() => {
                          setSelectedHour(h);
                          autoSelectSlot(viewDate, h);
                        }}
                          style={{
                            background: selectedHour === h ? theme.color.gold : theme.color.surface2,
                            color: selectedHour === h ? theme.color.charcoal900 : theme.color.text1,
                            fontWeight: selectedHour === h ? 800 : 700,
                            border: \`1px solid \${selectedHour === h ? theme.color.goldMid : theme.color.border}\`,
                            borderRadius: 999, padding: "12px 0", fontSize: 14, cursor: "pointer", transition: "all 0.2s ease",
                            boxShadow: selectedHour === h ? theme.shadow.gold : "0 2px 4px rgba(0,0,0,0.02)"
                          }}>
                          {formatMin(h * 60)}
                        </button>
                      ))}
                    </div>`;

const hourGridNew = `                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
                      {hours.map((h) => {
                        const isSelected = selectedHours.includes(h);
                        return (
                          <button key={h} onClick={() => {
                            let newHours = [...selectedHours];
                            if (isSelected) {
                              newHours = newHours.filter(x => x !== h);
                            } else {
                              newHours.push(h);
                            }
                            newHours.sort((a,b) => a-b);
                            setSelectedHours(newHours);
                            
                            // If exactly 1 hour is selected, auto-select a slot so the minute grid works
                            if (newHours.length === 1) {
                               autoSelectSlot(viewDate, newHours[0]);
                            } else {
                               setDraft(null); // Clear specific minute draft if multiple hours
                            }
                          }}
                            style={{
                              background: isSelected ? theme.color.gold : theme.color.surface2,
                              color: isSelected ? theme.color.charcoal900 : theme.color.text1,
                              fontWeight: isSelected ? 800 : 700,
                              border: \`1px solid \${isSelected ? theme.color.goldMid : theme.color.border}\`,
                              borderRadius: 999, padding: "12px 0", fontSize: 14, cursor: "pointer", transition: "all 0.2s ease",
                              boxShadow: isSelected ? theme.shadow.gold : "0 2px 4px rgba(0,0,0,0.02)"
                            }}>
                            {formatMin(h * 60)}
                          </button>
                        );
                      })}
                    </div>`;

c = c.replace(hourGridOld, hourGridNew);

// 5. Draft Summary & Add to Cart
// Find the block starting with `{draft && isSameDate(draft.date, viewDate) && (() => {`
// And replace it.
const summaryRegex = /\{draft && isSameDate\(draft\.date, viewDate\) && \(\(\) => \{[\s\S]*?\}\)\(\)\}/;

const summaryNew = `{selectedHours.length > 0 && (() => {
                    const draftDurationSec = draftLoops * (videoSeconds || 60);
                    const draftPrice = calcCost(draftDurationSec, selectedCreative?.ppm_rate || PPM);
                    const draftDurationMin = Math.ceil(draftDurationSec / 60);
                    
                    // Check conflicts for all selected hours
                    const bookings = bookingsForDate(localDateKey(viewDate));
                    let hasConflict = false;
                    
                    // If 1 hour selected and draft is set, check specific minute. Else check if any room in the hour.
                    if (selectedHours.length === 1 && draft) {
                        for(let m = 0; m < draftDurationMin; m++) {
                            if (isStartInsideBooking(draft.startMin + m, bookings)) hasConflict = true;
                        }
                    } else {
                        selectedHours.forEach(h => {
                            let firstAvailMin = h * 60;
                            while(firstAvailMin < (h + 1) * 60 && isStartInsideBooking(firstAvailMin, bookings)) {
                              firstAvailMin++;
                            }
                            if (firstAvailMin >= (h + 1) * 60) hasConflict = true; // No room in this hour
                            else {
                               for(let m = 0; m < draftDurationMin; m++) {
                                  if (isStartInsideBooking(firstAvailMin + m, bookings)) hasConflict = true;
                               }
                            }
                        });
                    }

                    const isInvalid = hasConflict;
                    const totalCost = draftPrice.cost * selectedHours.length;

                    return (
                      <div style={{ marginTop: 28, padding: "28px", background: isInvalid ? theme.color.errorLight : \`linear-gradient(135deg, \${theme.color.surface2} 0%, \${theme.color.surface} 100%)\`, border: \`1px solid \${isInvalid ? theme.color.error : theme.color.border2}\`, borderRadius: 20, boxShadow: theme.shadow.md }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <div style={{ fontWeight: 800, fontSize: 20, color: isInvalid ? theme.color.error : theme.color.text1, letterSpacing: "-0.3px" }}>
                            {isInvalid ? 'Invalid Selection' : 'Duration & Booking Details'}
                          </div>
                          <button onClick={() => { setSelectedHours([]); setDraft(null); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: theme.color.text3, fontSize: 13, fontWeight: 700 }}><X size={16} /> Clear</button>
                        </div>

                        {/* Loops Stepper */}
                        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: theme.color.text3, textTransform: "uppercase", marginBottom: 6 }}>Loops (Full Plays)</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button onClick={() => setDraftLoops(prev => Math.max(1, prev - 1))} style={{...stepBtnStyle, width: 36, height: 36}}>−</button>
                              <span className="mono" style={{ width: 44, textAlign: "center", fontWeight: 800, fontSize: 20, color: theme.color.text1 }}>{draftLoops}</span>
                              <button onClick={() => setDraftLoops(prev => prev + 1)} style={{ ...stepBtnStyle, width: 36, height: 36 }}>+</button>
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ background: theme.color.surface, borderRadius: 16, padding: "16px 20px", border: \`1px solid \${theme.color.border2}\`, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                              <div className="mono" style={{ fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
                                <span style={{ color: theme.color.text2 }}>
                                  {selectedHours.length} Block(s) selected <span style={{ color: theme.color.text4, fontWeight: 500, fontSize: 13 }}>({formatDurationSec(draftDurationSec)} each)</span>
                                </span>
                                <span style={{ color: theme.color.goldDark, fontWeight: 800, fontSize: 20 }}>{naira(totalCost)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isInvalid ? (
                           <div style={{ display: "flex", gap: 10, alignItems: "center", background: theme.color.surface, borderRadius: 10, padding: "14px", fontSize: 14, color: theme.color.error, border: \`1px solid \${theme.color.errorLight}\` }}>
                             <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                             <span style={{ fontWeight: 600 }}>Not enough open room for this selection. Try different hours or fewer loops.</span>
                           </div>
                        ) : (
                           <>
                             <div style={{ fontSize: 14, color: theme.color.text3, lineHeight: 1.6, marginBottom: 20, fontWeight: 500 }}>
                               <strong>Video Length:</strong> {videoSeconds}s<br/>
                               <strong>Total Time Needed Per Block:</strong> {videoSeconds * draftLoops}s<br/>
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full">
                               <button onClick={() => {
                                  // Add to Cart multiple hours
                                  const newItems = [];
                                  selectedHours.forEach(h => {
                                     let startMin = h * 60;
                                     if (selectedHours.length === 1 && draft) startMin = draft.startMin;
                                     else {
                                        while(startMin < (h + 1) * 60 && isStartInsideBooking(startMin, bookings)) startMin++;
                                     }
                                     newItems.push({
                                        id: crypto.randomUUID(),
                                        creative: selectedCreative,
                                        date: viewDate,
                                        startMin,
                                        loops: draftLoops,
                                        durationSec: draftDurationSec,
                                        priceInfo: draftPrice
                                     });
                                  });
                                  if (newItems.length > 0) {
                                     addMultipleToCart(newItems);
                                     toast(\`Added \${newItems.length} slot(s) to Cart!\`, "success");
                                  }
                               }} className="flex-1 min-w-[200px] justify-center" style={{ padding: "16px 28px", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", gap: 10, alignItems: "center", boxShadow: theme.shadow.gold, transition: "all 0.2s" }}>
                                 Add to Cart
                               </button>
                               <button onClick={() => setSpreadModal(true)} className="flex-1 min-w-[160px] justify-center" style={{ padding: "14px 20px", borderRadius: 12, border: \`1px solid \${theme.color.border2}\`, background: theme.color.surface, fontSize: 15, fontWeight: 700, cursor: "pointer", color: theme.color.text1, display: "flex", gap: 8, alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                                 <RepeatIcon size={16} /> Spread Booking...
                               </button>
                               {cart.length > 0 && (
                                 <button onClick={() => {
                                    setShowSlotModal(false);
                                    router.push('/cart');
                                 }} className="w-full md:w-auto md:flex-1 justify-center" style={{ padding: "14px 20px", borderRadius: 12, border: "none", background: theme.color.charcoal900, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", gap: 8, alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                                   View Cart ({cart.length}) <ChevronRight size={16} />
                                 </button>
                               )}
                             </div>
                           </>
                        )}
                      </div>
                    );
                  })()}`;

c = c.replace(summaryRegex, summaryNew);

// 6. Minute Grid changes (Only show if selectedHours.length === 1)
const gridStartPattern = `{/* Minute Grid */}`;
const gridReplacement = `{/* Minute Grid (Only show for single hour selection) */}
                  {selectedHours.length === 1 ? (
                    <div style={{ background: theme.color.surface2, borderRadius: 20, padding: "28px", border: \`1px solid \${theme.color.border2}\`, marginTop: 28, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: theme.color.text1, letterSpacing: "-0.3px" }}>{formatMin(selectedHours[0] * 60)} Slots (Minute-by-Minute)</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.color.goldDark, background: theme.color.goldLight, padding: "6px 12px", borderRadius: 8 }}>
                          {(() => {
                             const bookings = bookingsForDate(localDateKey(viewDate));
                             let available = 0;
                             for(let m=0; m<60; m++) {
                               if(!isStartInsideBooking(selectedHours[0] * 60 + m, bookings)) available++;
                             }
                             return \`\${available} Available Slots\`;
                          })()}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))", gap: 8 }}>
                        {Array.from({ length: 60 }).map((_, m) => {
                          const minOfDay = selectedHours[0] * 60 + m;
                          const bookings = bookingsForDate(localDateKey(viewDate));
                          const isBooked = isStartInsideBooking(minOfDay, bookings);
                          
                          let isSelected = false;
                          const draftDurationSec = draftLoops * (videoSeconds || 60);
                          if (draft && isSameDate(draft.date, viewDate)) {
                            const draftEnd = draft.startMin + draftDurationSec / 60;
                            if (minOfDay >= draft.startMin && minOfDay < draftEnd) {
                              isSelected = true;
                            }
                          }

                          return (
                            <button key={m}
                              onClick={() => {
                                if (isBooked) return;
                                setDraft({ date: viewDate, startMin: minOfDay, loops: draftLoops });
                              }}
                              disabled={isBooked}
                              style={{
                                aspectRatio: "1.5", borderRadius: 10, border: \`1px solid \${isSelected ? theme.color.goldMid : isBooked ? "transparent" : theme.color.border2}\`,
                                background: isBooked ? theme.color.surface2 : isSelected ? theme.color.gold : theme.color.surface,
                                color: isBooked ? theme.color.text4 : isSelected ? theme.color.charcoal900 : theme.color.text2,
                                fontWeight: isSelected ? 800 : 600,
                                fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: isBooked ? "not-allowed" : "pointer", opacity: isBooked ? 0.6 : 1, transition: "all 0.2s ease",
                                boxShadow: isSelected ? theme.shadow.gold : "0 1px 2px rgba(0,0,0,0.03)"
                              }}
                              className="mono">
                              1m
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : selectedHours.length > 1 ? (
                    <div style={{ background: theme.color.surface2, borderRadius: 20, padding: "28px", border: \`1px solid \${theme.color.border2}\`, marginTop: 28, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", textAlign: "center", color: theme.color.text3 }}>
                      <Info size={24} style={{ margin: "0 auto 12px", color: theme.color.gold }} />
                      <div style={{ fontSize: 15, fontWeight: 600, color: theme.color.text1, marginBottom: 8 }}>Minute-Level Precision Disabled</div>
                      <div style={{ fontSize: 14 }}>Because you have selected multiple hours, specific minute selection is disabled. Slots will automatically be placed at the first available minute within each chosen hour.</div>
                    </div>
                  ) : null}`;

// The grid extends until the `</div>\n              </div>\n            </div>` for the modal container
const gridRegex = /\{\/\* Minute Grid \*\/\}[\s\S]*?(?=\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}\n\s*\{\/\* SPREAD MODAL)/;

c = c.replace(gridRegex, gridReplacement);

// 7. Spread Booking Logic
// Find handleSpreadAdd function
// Replace its contents
const spreadFuncRegex = /const handleSpreadAdd = \(\) => \{[\s\S]*?\};\n\n  const saveCartEdit/m;
const spreadFuncNew = `const handleSpreadAdd = () => {
    if (selectedHours.length === 0) return;
    const addedItems = [];
    let dDate = new Date(viewDate);
    
    const draftDurationSec = draftLoops * (videoSeconds || 60);
    const draftPrice = calcCost(draftDurationSec, selectedCreative?.ppm_rate || PPM);

    const checkDays = spreadDuration === "1week" ? 7 :
                      spreadDuration === "4weeks" ? 28 :
                      spreadDuration === "3months" ? 90 :
                      spreadDuration === "6months" ? 180 : 365;

    let added = 0;
    let skipped = 0;
    let dayIndex = 0;

    while (dayIndex < checkDays) {
      let isMatch = false;
      const dow = dDate.getDay();
      
      if (spreadPattern === "daily") isMatch = true;
      else if (spreadPattern === "weekdays" && dow >= 1 && dow <= 5) isMatch = true;
      else if (spreadPattern === "weekends" && (dow === 0 || dow === 6)) isMatch = true;
      else if (spreadPattern === "alternate" && dayIndex % 2 === 0) isMatch = true;
      else if (spreadPattern === "custom" && customDays.includes(dow)) isMatch = true;

      if (isMatch) {
         const bookings = bookingsForDate(localDateKey(dDate));
         const dDateCopy = new Date(dDate);

         selectedHours.forEach(h => {
             let startMin = h * 60;
             if (selectedHours.length === 1 && draft && isSameDate(draft.date, viewDate) && dayIndex === 0) {
                 startMin = draft.startMin;
             } else {
                 while(startMin < (h + 1) * 60 && isStartInsideBooking(startMin, bookings)) startMin++;
             }
             
             if (startMin < (h + 1) * 60) {
                // Check if full duration fits
                let fits = true;
                for(let m = 0; m < Math.ceil(draftDurationSec / 60); m++) {
                   if (isStartInsideBooking(startMin + m, bookings)) fits = false;
                }
                
                if (fits) {
                   addedItems.push({
                      id: crypto.randomUUID(),
                      creative: selectedCreative,
                      date: dDateCopy,
                      startMin,
                      loops: draftLoops,
                      durationSec: draftDurationSec,
                      priceInfo: draftPrice
                   });
                   added++;
                } else {
                   skipped++;
                }
             } else {
                skipped++;
             }
         });
      }
      
      dDate = addDays(dDate, 1);
      dayIndex++;
    }
    
    if (addedItems.length > 0) addMultipleToCart(addedItems);
    setSpreadModal(false);
    setMessage(skipped > 0 ? \`Added \${added} bookings. Skipped \${skipped} due to conflicts.\` : \`Successfully spread \${added} bookings.\`);
  };

  const saveCartEdit`;

c = c.replace(spreadFuncRegex, spreadFuncNew);

// 8. Remove old add to cart logic (handleAddToCart)
const oldAddToCartRegex = /const handleAddToCart = \(\) => \{[\s\S]*?\};\n\n  const handleSpreadAdd/m;
c = c.replace(oldAddToCartRegex, 'const handleAddToCart = () => {};\n\n  const handleSpreadAdd');

// 9. Fix setCurrentStep(3) in View Cart button for message modal
c = c.replace(/setCurrentStep\(3\);\n\s*window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);/g, "router.push('/cart');");

// 10. Update the SPREAD MODAL summary label: "Select how you want to duplicate your X slot."
c = c.replace(/Select how you want to duplicate your \{formatMin\(draft\.startMin\)\} slot\./, 'Select how you want to duplicate your {selectedHours.length} selected slot(s).');

fs.writeFileSync('frontend/app/book/page.tsx', c);
console.log('Successfully updated modal logic!');
