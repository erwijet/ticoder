use std::fs::read_dir;
use std::io::ErrorKind;
use std::path::PathBuf;
use std::{env, io};

/// Adapted from https://github.com/neilwashere/rust-project-root
pub fn get_project_root() -> io::Result<String> {
    let path = env::current_dir()?;
    let path_ancestors = path.as_path().ancestors();

    for p in path_ancestors {
        let has_cargo = read_dir(p)?.any(|p| p.unwrap().file_name() == *"Cargo.lock");
        if has_cargo {
            return Ok(PathBuf::from(p).to_str().unwrap().to_owned());
        }
    }
    Err(io::Error::new(
        ErrorKind::NotFound,
        "Ran out of places to find Cargo.toml",
    ))
}

pub fn expect(check: bool) -> Option<()> {
    if check {
        Some(())
    } else {
        None
    }
}
