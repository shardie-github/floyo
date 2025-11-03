"""Setup configuration for floyo."""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text() if readme_file.exists() else ""

setup(
    name="floyo",
    version="0.1.0",
    description="Tiny system app that suggests concrete, niche API integrations based on actual user routine",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="floyo contributors",
    license="Apache-2.0",
    packages=find_packages(),
    python_requires=">=3.7",
    install_requires=[],
    entry_points={
        "console_scripts": [
            "floyo=floyo.cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
