const tapeInput =
  document.getElementById('tapeFile');

const meshInput =
  document.getElementById('meshFile');

const runBtn =
  document.getElementById('runBtn');

const downloadBtn =
  document.getElementById('downloadBtn');

const output =
  document.getElementById('output');

let exportedCsv = '';

/**
 * Read uploaded file as text
 */
function readFile(file) {
  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
}

/**
 * Run operational validation
 */
runBtn.addEventListener(
  'click',
  async () => {

    try {

      const tapeFile =
        tapeInput.files[0];

      const meshFile =
        meshInput.files[0];

      if (!tapeFile) {
        output.textContent =
          'Please upload Tape CSV';

        return;
      }

      // Read files
      const tapeCsv =
        await readFile(tapeFile);

      const meshCsv =
        meshFile
          ? await readFile(meshFile)
          : '';

      output.textContent =
        'Processing operational validation...';

      // TEMPORARY MOCK RESULT
      // Later this will connect
      // to processTape()

      const mockReport = {
        totalFlights: 3,
        validFlights: 2,
        invalidFlights: 1,

        rvsmOccupancyCount: 2,

        rvsmCrossingCount: 1,

        averageExposureMinutes: 42.5,

        speedWarnings: 1,
      };

exportedCsv =
`CHAMADA;TIPO;VALID
TAP;B737;YES
GOL;B738;NO`;

      output.textContent =
        JSON.stringify(
          mockReport,
          null,
          2
        );

    }

    catch (err) {

      output.textContent =
        'Validation error: ' +
        err.message;
    }
  }
);
/**
 * Download exported CSV
 */
downloadBtn.addEventListener(
  'click',
  () => {

    if (!exportedCsv) {

      output.textContent =
        'No CSV available for download';

      return;
    }

    const blob = new Blob(
      [exportedCsv],
      {
        type: 'text/csv',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download =
      'rvsm-validation-results.csv';

    a.click();

    URL.revokeObjectURL(url);
  }
);
