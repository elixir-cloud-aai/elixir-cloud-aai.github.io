#### Description

<!-- Please include a summary of the change and the relevant issue(s) it resolves,
if any (otherwise delete that line), e.g., `Fixes #123`. If the PR addresses
more than one issue, please add multiple lines, each starting with 'Fixes #'.
Please stick to that syntax precisely, including whitespaces, otherwise the
issue(s) may not be linked to the PR.

In the summary, list any dependencies that are required for this change.
Please use bullet points for the description. Please also briefly describe
the relevant motivation and context briefly. For very trivial changes that are
duly explained by the PR title, a description can be omitted. -->

- Fixes #(issue number)

#### Checklist

<!-- Please go through the following checklist to ensure that your change is ready
for review. Please do not forget to double check the list after you have
modified your PR, e.g., if you have added commits to address reviewer
comments or to fix failing automated checks. **Please check items also if they
do not apply to your change**, e.g., if your change does not require an update
of the user-facing documentation, still check the box.

Generally, **PRs are only reviewed when all boxes are ticked off and all
automated checks pass** (use the comment section below if you believe that
your PR is ready to be merged even though not all boxes were ticked off). -->

- [ ] My code follows the [contributing guidelines](workflow.md) of this
    project, including, in particular, with regard to any style guidelines
- [ ] The title of my PR complies with the [Conventional Commits
    specification][conv-commits]; in particular, it clearly indicates
    that a change is a breaking change
- [ ] I acknowledge that all my commits will be squashed into a single commit,
    using the PR title as the commit message
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code in hard-to-understand areas
- [ ] I have updated the user-facing documentation to describe any new or
    changed behavior
- [ ] I have added type annotations for all function/class/method interfaces
    or updated existing ones (only for Python, TypeScript, etc.)
- [ ] I have provided appropriate documentation ([Google-style
    Python docstrings][py-doc-google] or [JSDoc block tags][jsdoc] ) for all
    packages/modules/functions/classes/methods or updated existing ones
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature
    works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have not reduced the existing code coverage


#### Comments

<!-- If there are unchecked boxes in the list above, but you would still like your
PR to be reviewed or considered for merging, please describe here why boxes
were not checked. For example, if you are positive that your commits should
_not_ be squashed when merging, please explain why you think the PR warrants
or requires multiple commits to be added to the history (but note that in
that case, it is a prerequisite that all commits follow the Conventional
Commits specification). -->

[py-doc-google]: https://google.github.io/styleguide/pyguide.html
[jsdoc]: https://jsdoc.app/
[conv-commits]: https://www.conventionalcommits.org/en
