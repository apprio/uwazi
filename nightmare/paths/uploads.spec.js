/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 500]*/
import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

const comicCharacter = '58ad7d240d44252fee4e61fd';

describe('Uploads', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  fit('should log in as admin', (done) => {
    nightmare
    .login('admin', 'admin')
    .goToUploads()
    .then(() => {
      done();
    })
    .catch(catchErrors(done));
  });

  describe('when filtering by type', () => {
    it('should show only filtered ones', (done) => {
      nightmare
      .library.editCard('Wolverine')
      .select('#metadataForm > div:nth-child(2) > ul > li.wide > select', comicCharacter)
      .library.saveCard()
      .refresh()
      .library.selectFilter('Comic character')
      .library.countFiltersResults()
      .then((resutls) => {
        expect(resutls).toBe(1);
        done();
      })
      .then(done);
    });
  });

  describe('when uploading a pdf', () => {
    it('should create the new document and show a "no type state"', (done) => {
      const expectedTitle = 'Valid';

      nightmare
      .upload('.upload-box input', `${__dirname}/test_files/valid.pdf`)
      .waitForCardToBeCreated(expectedTitle)
      .waitForCardStatus(selectors.uploadsView.firstDocument, 'No type selected')
      .getResultsAsJson()
      .then((results) => {
        expect(results[0].title).toBe(expectedTitle);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when processing fails', () => {
      fit('should create the document and show "Conversion failed"', (done) => {
        const expectedTitle = 'Invalid';

        nightmare
        .upload('.upload-box input', `${__dirname}/test_files/invalid.pdf`)
        .wait(() => {
          console.log(0);
          return true;
        })
        .waitForCardToBeCreated(expectedTitle)
        .wait(() => {
          console.log(1);
          return true;
        })
        .waitForCardStatus(selectors.uploadsView.firstDocument, 'Conversion failed')
        .wait(() => {
          console.log(2);
          return true;
        })
        .getResultsAsJson()
        .then((results) => {
          expect(results[0].title).toBe(expectedTitle);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });
});
