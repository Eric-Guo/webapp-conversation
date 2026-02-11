namespace :nextjs do
  set :nextjs_service_name, -> { "nextjs-#{fetch(:application).tr('_', '-')}" }

  task :stop do
    on roles(:web) do
      execute :sudo, :systemctl, :stop, fetch(:nextjs_service_name)
    end
  end

  task :start do
    on roles(:web) do
      execute :sudo, :systemctl, :start, fetch(:nextjs_service_name)
    end
  end

  task :restart do
    on roles(:web) do
      execute :sudo, :systemctl, :restart, fetch(:nextjs_service_name)
    end
  end
end
