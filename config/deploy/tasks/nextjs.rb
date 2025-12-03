namespace :nextjs do
  task :stop do
    on roles(:web) do
      execute :sudo, :systemctl, :stop, 'nextjs-sql-chat'
    end
  end

  task :start do
    on roles(:web) do
      execute :sudo, :systemctl, :start, 'nextjs-sql-chat'
    end
  end

  task :restart do
    on roles(:web) do
      execute :sudo, :systemctl, :restart, 'nextjs-sql-chat'
    end
  end
end
