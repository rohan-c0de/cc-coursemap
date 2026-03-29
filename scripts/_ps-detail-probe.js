const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://ps-sis.vccs.edu/psc/S92GUEST/EMPLOYEE/SA/c/VX_CUSTOM_SR.VX_SSR_CLSRCH_FL.GBL?COLLEGE=NV280&TERM=2262', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Select ENG, search
  await page.selectOption('#VX_CLSRCH_WRK2_SUBJECT', { label: 'ENG-English' });
  await page.waitForTimeout(1000);
  await page.click('#VX_CLSRCH_WRK2_SEARCH_BTN');
  
  // Wait for results
  await page.waitForFunction(() => {
    return document.body && document.body.innerText.includes('Class Nbr');
  }, { timeout: 20000 });
  await page.waitForTimeout(2000);
  
  console.log('Results loaded. Looking for clickable section links...');
  
  // Find section detail links
  const sectionLinks = await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('a').forEach(a => {
      const text = a.textContent || '';
      const id = a.id || '';
      if (id.includes('VX_RSLT') || text.includes('Class Nbr') || text.includes('Section')) {
        links.push({ id, text: text.trim().substring(0, 100), href: a.href });
      }
    });
    return links.slice(0, 20);
  });
  
  console.log('Section links found:', sectionLinks.length);
  sectionLinks.forEach(l => console.log('  ' + l.id + ': ' + l.text));
  
  // Try to find and extract all result data from the listing
  const resultData = await page.evaluate(() => {
    const results = [];
    // Look for result blocks - each section seems to be in its own div
    // The pattern from the text shows: title, status, section/class nbr, times, instructor, location
    const allText = document.body.innerText;
    
    // Extract Class Nbr patterns
    const classNbrPattern = /Class Nbr (\d+)/g;
    let match;
    const classNbrs = [];
    while ((match = classNbrPattern.exec(allText)) !== null) {
      classNbrs.push(match[1]);
    }
    
    return { classNbrs: classNbrs.slice(0, 20), totalClassNbrs: classNbrs.length };
  });
  
  console.log('\nClass Numbers found:', resultData.totalClassNbrs);
  console.log('First 20:', resultData.classNbrs.join(', '));
  
  // Now click on first section to see detail view
  console.log('\nClicking first section result...');
  
  // Look for the first clickable result
  const firstResult = await page.locator('[id*="VX_RSLT_WRK_VX_CLS_TITLE"]').first();
  if (await firstResult.isVisible().catch(() => false)) {
    await firstResult.click();
    await page.waitForTimeout(5000);
    
    const detailText = await page.evaluate(() => document.body ? document.body.innerText : '');
    console.log('\n=== DETAIL VIEW TEXT (3000 chars) ===');
    console.log(detailText.substring(0, 3000));
    
    await page.screenshot({ path: 'data/ps-discovery/nova-eng-detail.png', fullPage: true });
  } else {
    console.log('No VX_RSLT_WRK_VX_CLS_TITLE found, trying other selectors...');
    
    // Try clicking any link/div that contains a class number
    const clickable = await page.locator('a:has-text("ENG 111")').first();
    if (await clickable.isVisible().catch(() => false)) {
      await clickable.click();
      await page.waitForTimeout(5000);
      
      const detailText = await page.evaluate(() => document.body ? document.body.innerText : '');
      console.log('\n=== DETAIL VIEW TEXT (3000 chars) ===');
      console.log(detailText.substring(0, 3000));
    } else {
      console.log('Cannot find clickable section. Checking page structure...');
      
      // Dump all unique VX_RSLT element patterns
      const rsltEls = await page.evaluate(() => {
        const r = [];
        const seen = new Set();
        document.querySelectorAll('[id*="VX_RSLT"]').forEach(el => {
          const baseId = el.id.replace(/\$\d+/g, '$N');
          if (!seen.has(baseId)) {
            seen.add(baseId);
            const text = (el.textContent || '').trim();
            if (text.length > 2 && text.length < 300) {
              r.push(el.id + ' [' + el.tagName + ']: ' + text.substring(0, 120));
            }
          }
        });
        return r;
      });
      
      console.log('\nVX_RSLT elements:');
      rsltEls.slice(0, 30).forEach(l => console.log(l));
    }
  }
  
  await browser.close();
})();
