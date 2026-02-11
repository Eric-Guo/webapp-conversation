# config valid for current version and patch releases of Capistrano
lock '~> 3.19.0'

set :repo_url, 'https://git.thape.com.cn/ai/webapp-conversation.git'
set :branch, 'sso_login'

# Default deploy_to directory is /var/www/changelog
# set :deploy_to, "/var/www/changelog"

# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: "log/capistrano.log", color: :auto, truncate: :auto

# https://github.com/seuros/capistrano-sidekiq#known-issues-with-capistrano-3
set :pty, false

# Default value for :linked_files is []
append :linked_files, *%w[.env]

# Default value for linked_dirs is []
# append :linked_dirs, 'node_modules'

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for local_user is ENV['USER']
# set :local_user, -> { `git config user.name`.chomp }

# Default value for keep_releases is 5
set :keep_releases, 5

# Uncomment the following to require manually verifying the host key before first deploy.
# set :ssh_options, verify_host_key: :secure

set :pnpm_flags, %w(--frozen-lockfile)
set :pnpm_roles, :web
set :pnpm_env_variables, {}

before 'pnpm:install', 'nextjs:stop'
before 'deploy:symlink:release', 'pnpm:build'
after 'deploy:publishing', 'nextjs:start'

namespace :pnpm do
  desc 'Build Next.js application'
  task :build do
    on roles fetch(:pnpm_roles) do
      within fetch(:pnpm_target_path, release_path) do
        with fetch(:pnpm_env_variables, {}) do
          execute :pnpm, 'run', 'build'
        end
      end
    end
  end
end
