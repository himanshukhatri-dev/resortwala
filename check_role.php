<?php
use App\Models\User;
echo User::where('email', 'vendor@resortwala.com')->value('role');
