import * as ae from '@/audioengine.js';

const fs = require('fs');
const path = require('path');
const process = require('process');

const internalCache = {};

function getCacheFilename(file) {
	return path.join(path.dirname(file), `._${path.basename(file)}.vpm`);
}

async function processWaveform(file, window, cache = {}) {
	//console.log("window: " + window);

	let waveformData;

	if (!cache[window]) {
		waveformData = await ae.readAudioFileWaveform(file, window);
		if (window >= 128) {
			cache[window] = waveformData;
			fs.writeFile(getCacheFilename(file), JSON.stringify(cache), () => {});
			if (process.platform === 'win32') {
				const fswin = require('fswin');
				fswin.setAttributes(getCacheFilename(file), { IS_HIDDEN: true }, () => {});
			}
			internalCache[file] = cache;
		}
	} else {
		waveformData = cache[window];
	}

	return {
		file,
		waveformData,
		waveformWindow: window,
	};
}

export function requestWaveform(file, window) {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async function (resolve) {
		if (window < 1) {
			return resolve({
				file,
				waveformData: null,
				waveformWindow: 0,
			});
		}

		if (internalCache[file]) {
			resolve(await processWaveform(file, window, internalCache[file]));
		} else {
			fs.stat(getCacheFilename(file), function (err, stats) {
				fs.open(getCacheFilename(file), 'r', (err, fd) => {
					if (err) {
						if (err.code === 'ENOENT') {
							resolve(processWaveform(file, window));
							return;
						}
						throw err;
					}
					const buffer = new Buffer(stats.size);
					fs.read(
						fd,
						buffer,
						0,
						buffer.length,
						null,
						async (error, bytesRead, buffer) => {
							try {
								const cache = JSON.parse(buffer);
								resolve(await processWaveform(file, window, cache));
							} catch {
								resolve(await processWaveform(file, window));
							}
						}
					);
				});
			});
		}
	});
}
