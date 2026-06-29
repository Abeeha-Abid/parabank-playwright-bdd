import { Reporter, FullResult, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface ParsedSubStep {
  title: string;
  timestamp: string;
}

interface ParsedStep {
  keyword: string;
  text: string;
  timestamp: string;
  subSteps: ParsedSubStep[]; 
}

interface EmbeddedScreenshot {
  name: string;
  base64: string;
}

interface ParsedTest {
  title: string;
  status: string;
  tags: string[];
  steps: ParsedStep[];
  error?: string;
  screenshots: EmbeddedScreenshot[];         
  isApi: boolean; 
}

export default class DashboardReporter implements Reporter {
  private executedTests: ParsedTest[] = [];

  onStepEnd(test: TestCase, result: TestResult, step: TestStep) {
    if (step.category === 'test.step' && !step.title.toLowerCase().includes('hook')) {
      const timestamp = new Date().toLocaleTimeString();
      let statusText = 'PASS';
      let emoji = '✅';

      if (step.error) {
        statusText = 'FAIL';
        emoji = '❌';
      }
      console.log(`[${timestamp}] [${statusText}] ${emoji} Step: "${step.title}"`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const testTags = test.tags || [];

    const normalizedPath = test.location.file.replace(/\\/g, '/');
    const projectName = test.parent.project()?.name || '';
    const isApiTest = normalizedPath.toLowerCase().includes('api testing') || projectName.toLowerCase().includes('api');

    const stdoutChunks = result.stdout || [];
    const fullLogString = stdoutChunks.map(chunk => chunk.toString('utf8')).join('');

    const bddSteps: ParsedStep[] = result.steps
      .filter(s => s.category === 'test.step' && !s.title.toLowerCase().includes('hook'))
      .filter(s => !s.title.includes('↳ 🔘')) 
      .map(s => {
        const timeStr = s.startTime ? new Date(s.startTime).toLocaleTimeString() : new Date().toLocaleTimeString();
        
        const directChildren = s.steps || [];
        const flatChildren = result.steps.filter(child => child.parent === s);
        const combinedChildren = [...directChildren, ...flatChildren];
        const uniqueChildren = combinedChildren.filter((item, pos) => combinedChildren.indexOf(item) === pos);

        let nestedChildren: ParsedSubStep[] = [];

        if (!isApiTest) {
          nestedChildren = uniqueChildren
            .filter(child => child.title.includes('↳ 🔘'))
            .map(child => ({
              title: child.title,
              timestamp: child.startTime ? new Date(child.startTime).toLocaleTimeString() : new Date().toLocaleTimeString()
            }));
        } else {
          // Robust Extraction for Backend API Strategies
          if (s.title.startsWith('When') || s.title.startsWith('Then') || s.title.startsWith('And')) {
            let extractedPayload = '';

            if (s.title.includes('register user') || s.title.includes('logout landing service')) {
              const htmlRegex = /Response\s+Received\s+\(HTML\s+Snippet\):\s*([\s\S]*?)(?=\[?\d{1,2}:\d{2}:\d{2}|Response\s+Received|$)/i;
              const match = fullLogString.match(htmlRegex);
              if (match && match[1]) {
                extractedPayload = match[1].trim();
              }
            } else {
              // Extract multi-line JSON blocks reliably within this test's unique scope
              const jsonRegex = /Response\s+Received:\s*([\s\S]*?)(?=\[?\d{1,2}:\d{2}:\d{2}|Response\s+Received|$)/gi;
              const matches = [...fullLogString.matchAll(jsonRegex)];
              
              // If there's a match sequentially in this local test chunk, use it
              if (matches.length > 0) {
                // If a single test has multiple API calls, step title mapping falls back gracefully
                if (s.title.includes('accounts list') && matches[1]) extractedPayload = matches[1][1];
                else extractedPayload = matches[0][1]; // Default to first available capture for this scenario
              }
            }

            // Fallback to line-by-line scanning if multi-line regex drops text
            if (!extractedPayload || extractedPayload.trim().length === 0) {
              const lines = fullLogString.split('\n').map(l => l.trim());
              
              if (s.title.includes('register user') || s.title.includes('logout landing service')) {
                const targetLine = lines.find(l => l.toLowerCase().includes('html snippet'));
                if (targetLine) extractedPayload = targetLine.split(/html snippet\):/i)[1] || targetLine;
              } else {
                // Instantly grabs the localized log for Scenario 3 onwards without sequence mismatches
                const targetLine = lines.find(l => l.includes('Response Received:'));
                if (targetLine) extractedPayload = targetLine.split('Response Received:')[1] || targetLine;
              }
            }

            if (extractedPayload && extractedPayload.trim().length > 0) {
              const cleanPayload = extractedPayload.replace(/</g, "&lt;").replace(/>/g, "&gt;");
              nestedChildren.push({
                title: `↳ 🔘 API Response Data: <pre style="background: #1e293b; color: #38bdf8; padding: 10px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; word-break: break-all; margin-top: 5px; font-size: 12px; text-align: left;">${cleanPayload.trim()}</pre>`,
                timestamp: timeStr
              });
            }
          }
        }

        const gherkinMatch = s.title.match(/^(Given|When|Then|And|But)\s+(.*)$/i);
        if (gherkinMatch) {
          return {
            keyword: gherkinMatch[1].charAt(0).toUpperCase() + gherkinMatch[1].slice(1).toLowerCase(),
            text: gherkinMatch[2],
            timestamp: timeStr,
            subSteps: nestedChildren
          };
        }
        return { keyword: 'Step', text: s.title, timestamp: timeStr, subSteps: nestedChildren };
      });

    const errorMessage = result.error?.message 
      ? result.error.message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '') 
      : undefined;

    const embeddedImages: EmbeddedScreenshot[] = [];
    if (result.attachments) {
      for (const attachment of result.attachments) {
        if (attachment.contentType?.startsWith('image/')) {
          let base64Image = '';
          if (attachment.body && Buffer.isBuffer(attachment.body)) {
            base64Image = attachment.body.toString('base64');
          } else if (attachment.path && fs.existsSync(attachment.path)) {
            base64Image = fs.readFileSync(attachment.path, 'base64');
          }
          if (base64Image) {
            embeddedImages.push({
              name: attachment.name || 'Execution Snapshot',
              base64: `data:${attachment.contentType};base64,${base64Image}`
            });
          }
        }
      }
    }

    this.executedTests.push({
      title: test.title,
      status: result.status,
      tags: testTags,
      steps: bddSteps,
      error: errorMessage,
      screenshots: embeddedImages,
      isApi: isApiTest
    });
  }

  onEnd(result: FullResult) {
    const reportDir = path.join(process.cwd(), 'playwright-report');
    const targetFile = path.join(reportDir, 'executive-dashboard.html');

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const totalScenarios = this.executedTests.length;
    const passedTests = this.executedTests.filter(t => t.status === 'passed').length;
    const failedTests = this.executedTests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
    const successRatio = totalScenarios > 0 ? Math.round((passedTests / totalScenarios) * 100) : 0;

    const filterSuite = (targetTag: string) => {
      const cleanTarget = targetTag.replace('@', '').trim().toLowerCase();
      return this.executedTests.filter(t => {
        const matchInArray = t.tags.some(tag => tag.replace('@', '').trim().toLowerCase() === cleanTarget);
        const matchInTitle = t.title.toLowerCase().includes(`@${cleanTarget}`);
        return matchInArray || matchInTitle;
      });
    };
    
    const smokeStats = { total: filterSuite('smoke').length, passed: filterSuite('smoke').filter(t => t.status === 'passed').length };
    const sanityStats = { total: filterSuite('sanity').length, passed: filterSuite('sanity').filter(t => t.status === 'passed').length };
    const regressionStats = { total: filterSuite('regression').length, passed: filterSuite('regression').filter(t => t.status === 'passed').length };
    
    const uiTests = this.executedTests.filter(t => !t.isApi);
    const uiStats = { total: uiTests.length, passed: uiTests.filter(t => t.status === 'passed').length };

    const apiTests = this.executedTests.filter(t => t.isApi);
    const apiStats = { total: apiTests.length, passed: apiTests.filter(t => t.status === 'passed').length };

    const smokeRatio = smokeStats.total > 0 ? Math.round((smokeStats.passed / smokeStats.total) * 100) : 0;
    const sanityRatio = sanityStats.total > 0 ? Math.round((sanityStats.passed / sanityStats.total) * 100) : 0;
    const regressionRatio = regressionStats.total > 0 ? Math.round((regressionStats.passed / regressionStats.total) * 100) : 0;
    const uiRatio = uiStats.total > 0 ? Math.round((uiStats.passed / uiStats.total) * 100) : 0;
    const apiRatio = apiStats.total > 0 ? Math.round((apiStats.passed / apiStats.total) * 100) : 0;

    const executionRowsHtml = this.executedTests.map((test, index) => {
      const isPassed = test.status === 'passed';
      const statusClass = isPassed ? 'passed' : 'failed';
      const statusLabel = isPassed ? 'Passed' : 'Failed';
      
      const arrayFilters = test.tags.map(tag => tag.replace('@', '').trim().toLowerCase());
      if (test.isApi) {
        arrayFilters.push('api-test-suite');
      } else {
        arrayFilters.push('ui-test-suite');
      }
      const cssFilterClasses = arrayFilters.join(' ');

      const tagsBadges = test.tags
        .map(tag => `<span class="tag-badge">${tag.startsWith('@') ? tag : '@' + tag}</span>`)
        .join(' ');

      const stepsItems = test.steps
        .map(step => {
          const hasSubSteps = step.subSteps && step.subSteps.length > 0;
          const subStepsHtml = hasSubSteps
            ? step.subSteps.map(sub => `
                <div class="sub-step-item">
                  <span class="sub-step-title">${sub.title}</span>
                </div>
              `).join('')
            : '';

          return `
            <div class="step-container" style="margin-bottom: 14px;">
              <div class="step-item ${hasSubSteps ? 'step-clickable collapsed' : ''}" onclick="${hasSubSteps ? 'toggleStepActions(this)' : ''}">
                <span class="step-time">[${step.timestamp}]</span>
                <span class="step-keyword">
                  ${hasSubSteps ? '<span class="step-arrow">▼</span>' : ''}${step.keyword}
                </span>
                <span class="step-text">${step.text}</span>
              </div>
              ${hasSubSteps ? `
                <div class="nested-substeps-wrapper" style="margin-left: 24px; border-left: 2px dashed #cbd5e1; padding-left: 12px; margin-top: 6px; display: none;">
                  ${subStepsHtml}
                </div>
              ` : ''}
            </div>
          `;
        }).join('');

      const errorBlock = test.error ? `<div class="error-log">${test.error}</div>` : '';
      
      const imagesBlock = (!test.isApi && test.screenshots) ? test.screenshots.map(img => `
        <div class="screenshot-holder">
          <strong>📸 ${img.name}:</strong>
          <img src="${img.base64}" alt="Execution Screenshot" />
        </div>
      `).join('') : '';

      return `
        <div class="scenario-accordion ${statusClass} ${cssFilterClasses}">
          <div class="scenario-header" onclick="toggleAccordion(this)">
            <div class="scenario-title-block">
              <div class="scenario-tags">${tagsBadges}</div>
              <div class="scenario-name">${test.title}</div>
            </div>
            <span class="status-badge">${statusLabel}</span>
          </div>
          <div class="scenario-steps">
            ${stepsItems}
            ${errorBlock}
            ${imagesBlock}
          </div>
        </div>
      `;
    }).join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ParaBank Executive Automation Dashboard</title>
  <style>
    :root {
      --bg-color: #f4f6f9;
      --header-bg: #1a233a;
      --card-bg: #ffffff;
      --text-main: #334155;
      --text-muted: #64748b;
      --pass-color: #10b981;
      --fail-color: #ef4444;
      --smoke-color: #f59e0b;
      --sanity-color: #8b5cf6;
      --regression-color: #3b82f6;
      --api-color: #06b6d4;
      --ui-color: #6366f1;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background-color: var(--bg-color); color: var(--text-main); padding: 40px 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    
    .header-panel { background-color: var(--header-bg); color: #ffffff; padding: 30px 40px; border-radius: 12px; margin-bottom: 25px; }
    .header-panel h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    .header-panel p { color: #94a3b8; font-size: 14px; }

    .nav-tabs { display: flex; gap: 12px; margin-bottom: 25px; }
    .tab-btn { background-color: #e2e8f0; border: none; padding: 12px 28px; font-size: 14px; font-weight: 600; color: var(--text-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .tab-btn.active { background-color: var(--header-bg); color: #ffffff; }

    .view-content { display: none; }
    .view-content.active { display: block; }

    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .metric-card { background: var(--card-bg); border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-top: 4px solid #cbd5e1; }
    .metric-card.passed { border-top-color: var(--pass-color); }
    .metric-card.failed { border-top-color: var(--fail-color); }
    .metric-card.ratio { border-top-color: var(--pass-color); }
    .metric-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
    .metric-value { font-size: 32px; font-weight: 700; }
    .metric-card.passed .metric-value { color: var(--pass-color); }
    .metric-card.failed .metric-value { color: var(--fail-color); }
    .metric-card.ratio .metric-value { color: var(--pass-color); }

    .breakdown-card { background: var(--card-bg); border-radius: 12px; padding: 35px 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .breakdown-card h2 { font-size: 18px; font-weight: 700; margin-bottom: 25px; }
    .suite-row { margin-bottom: 25px; }
    .suite-meta { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .suite-count span { font-size: 11px; color: #94a3b8; margin-left: 5px; }
    
    .progress-bar-bg { background-color: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; }
    .progress-bar-fill { height: 100%; border-radius: 8px; transition: width 0.4s ease; }
    .progress-bar-fill.smoke { background-color: var(--smoke-color); }
    .progress-bar-fill.sanity { background-color: var(--sanity-color); }
    .progress-bar-fill.regression { background-color: var(--regression-color); }
    .progress-bar-fill.api { background-color: var(--api-color); }
    .progress-bar-fill.ui { background-color: var(--ui-color); }

    .filter-wrapper { background: #e2e8f0; padding: 6px; border-radius: 8px; display: inline-flex; gap: 4px; margin-bottom: 15px; flex-wrap: wrap; }
    .filter-btn { border: none; background: transparent; padding: 8px 18px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; color: var(--text-muted); transition: all 0.2s; }
    .filter-btn.active { background: #ffffff; color: var(--header-bg); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

    .execution-list { display: flex; flex-direction: column; gap: 12px; }
    .scenario-accordion { background: var(--card-bg); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border-left: 5px solid transparent; }
    .scenario-accordion.passed { border-left-color: var(--pass-color); }
    .scenario-accordion.failed { border-left-color: var(--fail-color); }
    .scenario-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .scenario-header:hover { background-color: #f8fafc; }
    
    .scenario-title-block { display: flex; flex-direction: column; gap: 4px; }
    .scenario-tags { display: flex; gap: 6px; }
    .tag-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background-color: #f1f5f9; color: var(--text-muted); }
    .scenario-name { font-size: 15px; font-weight: 600; }
    .status-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
    .scenario-accordion.passed .status-badge { background-color: #ecfdf5; color: var(--pass-color); }
    .scenario-accordion.failed .status-badge { background-color: #fef2f2; color: var(--fail-color); }

    .scenario-steps { display: none; padding: 20px; background-color: #f8fafc; border-top: 1px solid #edf2f7; }
    .scenario-accordion.active .scenario-steps { display: block; }
    
    .step-container { display: flex; flex-direction: column; }
    .step-item { display: flex; gap: 8px; font-size: 14px; align-items: center; padding: 4px 0; }
    .step-clickable { cursor: pointer; transition: color 0.15s ease; }
    .step-clickable:hover .step-text { color: #2563eb; text-decoration: underline; }
    .step-time { font-family: monospace; color: var(--text-muted); font-size: 11.5px; min-width: 85px; display: inline-block; }
    .step-keyword { font-weight: 700; min-width: 65px; color: #1e293b; display: flex; align-items: center; gap: 4px; }
    .step-text { color: #334155; font-weight: 500; }
    .step-arrow { font-size: 9px; color: var(--text-muted); transition: transform 0.2s ease; display: inline-block; }
    .step-item.collapsed .step-arrow { transform: rotate(-90deg); }

    .sub-step-item { display: flex; gap: 10px; font-size: 13px; align-items: center; margin-top: 4px; }
    
    .error-log { background-color: #fdf2f2; border: 1px dashed var(--fail-color); color: var(--fail-color); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; margin-top: 12px; white-space: pre-wrap; }
    
    .screenshot-holder { margin-top: 18px; border-top: 1px dashed #cbd5e1; padding-top: 14px; }
    .screenshot-holder strong { font-size: 13px; color: var(--text-main); display: block; margin-bottom: 8px; }
    .screenshot-holder img { max-width: 100%; border: 2px solid #cbd5e1; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: block; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header-panel">
      <h1>ParaBank Executive Automation Dashboard</h1>
      <p>Client Executive View Execution Report | Built directly inside Playwright</p>
    </header>

    <nav class="nav-tabs">
      <button class="tab-btn active" onclick="switchView('dashboard-view', this)">Dashboard</button>
      <button class="tab-btn" onclick="switchView('execution-view', this)">Execution</button>
    </nav>

    <div id="dashboard-view" class="view-content active">
      <section class="metrics-grid">
        <div class="metric-card"><div class="metric-label">Total Scenarios</div><div class="metric-value">${totalScenarios}</div></div>
        <div class="metric-card passed"><div class="metric-label">Passed</div><div class="metric-value">${passedTests}</div></div>
        <div class="metric-card failed"><div class="metric-label">Failed</div><div class="metric-value">${failedTests}</div></div>
        <div class="metric-card ratio"><div class="metric-label">Success Ratio</div><div class="metric-value">${successRatio}%</div></div>
      </section>

      <section class="breakdown-card">
        <h2>Visual Test Suite Breakdowns</h2>
        <div class="suite-row">
          <div class="suite-meta"><span class="suite-name">💨 Smoke Test Suite Status</span><span class="suite-count">Passed: ${smokeStats.passed} / ${smokeStats.total} <span>${smokeRatio}% Success</span></span></div>
          <div class="progress-bar-bg"><div class="progress-bar-fill smoke" style="width: ${smokeRatio}%"></div></div>
        </div>
        <div class="suite-row">
          <div class="suite-meta"><span class="suite-name">🧠 Sanity Test Suite Status</span><span class="suite-count">Passed: ${sanityStats.passed} / ${sanityStats.total} <span>${sanityRatio}% Success</span></span></div>
          <div class="progress-bar-bg"><div class="progress-bar-fill sanity" style="width: ${sanityRatio}%"></div></div>
        </div>
        <div class="suite-row">
          <div class="suite-meta"><span class="suite-name">🍇 Full Regression Suite Status</span><span class="suite-count">Passed: ${regressionStats.passed} / ${regressionStats.total} <span>${regressionRatio}% Success</span></span></div>
          <div class="progress-bar-bg"><div class="progress-bar-fill regression" style="width: ${regressionRatio}%"></div></div>
        </div>
        <div class="suite-row">
          <div class="suite-meta"><span class="suite-name">💻 Frontend UI Testing Suite Status</span><span class="suite-count">Passed: ${uiStats.passed} / ${uiStats.total} <span>${uiRatio}% Success</span></span></div>
          <div class="progress-bar-bg"><div class="progress-bar-fill ui" style="width: ${uiRatio}%"></div></div>
        </div>
        <div class="suite-row">
          <div class="suite-meta"><span class="suite-name">⚙️ Backend API Testing Suite Status</span><span class="suite-count">Passed: ${apiStats.passed} / ${apiStats.total} <span>${apiRatio}% Success</span></span></div>
          <div class="progress-bar-bg"><div class="progress-bar-fill api" style="width: ${apiRatio}%"></div></div>
        </div>
      </section>
    </div>

    <div id="execution-view" class="view-content">
      <div class="filter-wrapper">
        <button class="filter-btn active" onclick="filterExecutionList('all', this)">All Scenarios</button>
        <button class="filter-btn" onclick="filterExecutionList('ui-test-suite', this)">UI Testing Only</button>
        <button class="filter-btn" onclick="filterExecutionList('api-test-suite', this)">API Testing Only</button>
        <button class="filter-btn" onclick="filterExecutionList('smoke', this)">Smoke Only</button>
        <button class="filter-btn" onclick="filterExecutionList('sanity', this)">Sanity Only</button>
        <button class="filter-btn" onclick="filterExecutionList('regression', this)">Regression Only</button>
      </div>
      <div class="execution-list">
        ${executionRowsHtml}
      </div>
    </div>
  </div>

  <script>
    function switchView(viewId, element) {
      document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');
      element.classList.add('active');
    }
    function toggleAccordion(element) {
      element.parentElement.classList.toggle('active');
    }
    function toggleStepActions(element) {
      const wrapper = element.nextElementSibling;
      if (wrapper && wrapper.classList.contains('nested-substeps-wrapper')) {
        if (wrapper.style.display === 'none' || wrapper.style.display === '') {
          wrapper.style.display = 'block';
          element.classList.remove('collapsed');
        } else {
          wrapper.style.display = 'none';
          element.classList.add('collapsed');
        }
      }
    }
    function filterExecutionList(selectedTag, element) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      element.classList.add('active');
      document.querySelectorAll('.scenario-accordion').forEach(card => {
        if (selectedTag === 'all' || card.classList.contains(selectedTag)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    fs.writeFileSync(targetFile, htmlContent, 'utf8');
    console.log("====================================================================");
    console.log("🚀 SUCCESS: Executive Dashboard dynamically updated with actual run details!");
    console.log("👉 Open: playwright-report/executive-dashboard.html");
    console.log("====================================================================");
  }
}