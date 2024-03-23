
#[macro_export]
/// A macro for handling `Result` types in a concise manner.
///
/// This macro provides a shorthand for handling `Result` types, allowing you to easily
/// handle the `Err` case by binding the error to a variable and executing a block of code
/// without introducing a new closure, such as in the case of `Result::map_err`
///
/// # Examples
///
/// ```
/// use std::fs::File;
/// use std::io::prelude::*;
/// use std::io;
///
/// macro_rules! maybe {
///     ($result:expr, let $err:ident in $handle:block) => {
///         match $result {
///             Ok(value) => value,
///             Err($err) => {
///                 $handle
///             }
///         }
///     };
/// }
///
/// fn read_file_contents(filename: &str) -> io::Result<String> {
///     let mut file = File::open(filename)?;
///     let mut contents = String::new();
///     file.read_to_string(&mut contents)?;
///     Ok(contents)
/// }
///
/// fn main() {
///     let filename = "example.txt";
///
///     let contents = maybe!(
///         read_file_contents(filename),
///         let error in {
///             eprintln!("Error reading file: {}", error);
///             return;
///         }
///     );
///
///     println!("File contents: {}", contents);
/// }
/// ```
///
/// In this example, the `maybe!` macro is used to handle the result of reading a file.
/// If an error occurs while reading the file, the error is bound to the variable `error`
/// and an error message is printed. Otherwise, the file contents are printed.
///
macro_rules! maybe {
    ($result:expr, let $err:ident in $handle:block) => {
        match $result {
            Ok(value) => value,
            Err($err) => {
                $handle
            }
        }
    };
}