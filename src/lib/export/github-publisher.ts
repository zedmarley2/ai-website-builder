import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const execFile = promisify(execFileCb);

export interface GitHubPublishOptions {
  projectDir: string;
  repoName: string;
  description: string;
  githubOwner: string;
}

export interface GitHubPublishResult {
  repoUrl: string;
  cloneUrl: string;
}

async function run(cmd: string, args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFile(cmd, args, {
    cwd,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return stdout.trim();
}

export async function publishToGitHub(options: GitHubPublishOptions): Promise<GitHubPublishResult> {
  const { projectDir, description, githubOwner } = options;
  let repoName = options.repoName;

  // Pre-flight: check gh is available and authenticated
  try {
    await run('gh', ['auth', 'status'], projectDir);
  } catch {
    throw new Error('GitHub CLI (gh) is not authenticated. Run `gh auth login` first.');
  }

  // Initialize git repo
  await run('git', ['init'], projectDir);
  await run('git', ['add', '-A'], projectDir);
  await run(
    'git',
    ['commit', '-m', 'Initial commit: exported from AI Website Builder'],
    projectDir
  );

  // Create repo and push
  const safeDescription = description.slice(0, 350);

  try {
    await run(
      'gh',
      [
        'repo',
        'create',
        `${githubOwner}/${repoName}`,
        '--public',
        '--description',
        safeDescription,
        '--source',
        '.',
        '--push',
      ],
      projectDir
    );
  } catch {
    // Repo name likely taken — append a short suffix and retry
    const suffix = crypto.randomBytes(2).toString('hex');
    repoName = `${repoName}-${suffix}`;

    await run(
      'gh',
      [
        'repo',
        'create',
        `${githubOwner}/${repoName}`,
        '--public',
        '--description',
        safeDescription,
        '--source',
        '.',
        '--push',
      ],
      projectDir
    );
  }

  return {
    repoUrl: `https://github.com/${githubOwner}/${repoName}`,
    cloneUrl: `https://github.com/${githubOwner}/${repoName}.git`,
  };
}
