#!/bin/sh

# This script creates the symlinks to the .git/hooks directory to enable them
# To prevent the hooks from running you may use "--no-verify", for example: git commit --no-verify -m "blah blah"

ln -s -f ../../hooks/pre-commit .git/hooks/pre-commit
ln -s -f ../../hooks/pre-push .git/hooks/pre-push