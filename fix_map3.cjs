const fs = require('fs');
let code = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

const target = `{selectedLocation.attachments && selectedLocation.attachments.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {selectedLocation.attachments.map((attachment: any, index: number) => {
                const isObject = typeof attachment === 'object' && attachment !== null;
                const url = isObject ? attachment.url : attachment;
                const type = isObject ? attachment.type : (url.includes('.mp4') || url.includes('video') ? 'video/mp4' : 'image/jpeg');
                return (
                  <div key={index} className="h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-slate-700 cursor-pointer relative group" onClick={() => window.open(url, '_blank')}>
                    {type.startsWith('video/') ? (
                      <>
                        <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                          <Play className="text-white fill-white/80" size={24} />
                        </div>
                      </>
                    ) : (
                      <img src={url} alt="Anexo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                  </div>
                );
              })}
            </div>
          )}`;

const replacement = `{selectedLocation.attachments && selectedLocation.attachments.length > 0 && (
            <div className="mb-4">
              <AttachmentGallery attachments={selectedLocation.attachments} />
            </div>
          )}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/MapPage.tsx', code);
